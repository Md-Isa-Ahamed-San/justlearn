import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { authConfig } from "./auth.config";
import { db } from "./lib/prisma";

// Constants for token expiration times
const ACCESS_TOKEN_EXPIRY = 15 * 60 * 1000; // 15 minutes in milliseconds
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// Function to generate custom JWT tokens for credentials login
function generateTokens(user) {
  const accessTokenPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    type: "access",
  };

  const refreshTokenPayload = {
    userId: user.id,
    email: user.email,
    type: "refresh",
  };

  const accessToken = jwt.sign(accessTokenPayload, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign(
      refreshTokenPayload,
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
  );

  return {
    accessToken,
    refreshToken,
    accessTokenExpires: Date.now() + ACCESS_TOKEN_EXPIRY,
  };
}

// Function to refresh access token for credentials
async function refreshCredentialsToken(token) {
  try {
    console.log("🔄 Refreshing credentials token...");

    // Verify the refresh token
    const decoded = jwt.verify(
        token.refreshToken,
        process.env.JWT_REFRESH_SECRET
    );

    // Get user from database to ensure they still exist
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      console.error("❌ User not found during token refresh");
      throw new Error("User not found");
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          name: user.name,
          type: "access",
        },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
    );

    console.log("✅ Successfully refreshed credentials token");

    return {
      ...token,
      accessToken: newAccessToken,
      accessTokenExpires: Date.now() + ACCESS_TOKEN_EXPIRY,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      },
      error: undefined, // Clear any previous errors
    };
  } catch (error) {
    console.error("❌ Error refreshing credentials token:", error.message);
    // Return null to trigger logout instead of returning error token
    return null;
  }
}

// Function to refresh Google access token
async function refreshGoogleAccessToken(token) {
  try {
    console.log("🔄 Refreshing Google access token...");

    const url = "https://oauth2.googleapis.com/token";
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: token.refreshToken,
    });

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
      body: params,
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      console.error("❌ Google token refresh failed:", refreshedTokens);
      throw new Error(refreshedTokens.error || "Token refresh failed");
    }

    console.log("✅ Successfully refreshed Google token");

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      error: undefined, // Clear any previous errors
    };
  } catch (error) {
    console.error("❌ Google token refresh error:", error.message);
    // Return null to trigger logout instead of returning error token
    return null;
  }
}

export const {
  auth,
  signIn,
  signOut,
  unstable_update,
  handlers: { GET, POST },
} = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Email and password are required");
          }

          const user = await db.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user) {
            throw new Error("No user found with this email");
          }

          if (!user.password) {
            throw new Error("Please sign in with Google");
          }

          const isMatch = await bcrypt.compare(
              credentials.password,
              user.password
          );

          if (!isMatch) {
            throw new Error("Invalid password");
          }

          console.log(
              "✅ Credentials authentication successful for:",
              user.email
          );

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (error) {
          console.error("❌ Credentials authentication failed:", error.message);
          throw error;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      // Handle session update triggered by unstable_update() in server actions.
      // When submitRole() or completeProfile() calls unstable_update({ user: {...} }),
      // NextAuth fires this callback with trigger="update" and session = the new data.
      // We merge it into the token so the cookie is re-written with fresh values.
      if (trigger === "update" && session?.user) {
        console.log("🔄 JWT update triggered:", session.user);
        return {
          ...token,
          user: {
            ...token.user,
            ...session.user,
          },
        };
      }

      // Initial sign in
      if (account && user) {
        console.log(`🔐 Initial sign in - Provider: ${account.provider}`);

        if (account.provider === "google") {
          // Fetch the user's role from DB — Google's profile doesn't include it
          const dbUser = await db.user.findUnique({
            where: { email: user.email },
            select: { id: true, role: true, isProfileComplete: true },
          });
          return {
            accessToken: account.access_token,
            accessTokenExpires: Date.now() + account.expires_in * 1000,
            refreshToken: account.refresh_token,
            provider: "google",
            user: {
              id: dbUser?.id || user.id,
              email: user.email,
              name: user.name,
              image: user.image,
              role: dbUser?.role || null,
              isProfileComplete: dbUser?.isProfileComplete || false,
            },
          };
        } else if (account.provider === "credentials") {
          const tokens = generateTokens(user);
          // Fetch role and isProfileComplete from DB for credentials users too
          const dbUser = await db.user.findUnique({
            where: { email: user.email },
            select: { id: true, role: true, isProfileComplete: true },
          });
          return {
            accessToken: tokens.accessToken,
            accessTokenExpires: tokens.accessTokenExpires,
            refreshToken: tokens.refreshToken,
            provider: "credentials",
            user: {
              id: dbUser?.id || user.id,
              email: user.email,
              name: user.name,
              image: user.image,
              role: dbUser?.role || null,
              isProfileComplete: dbUser?.isProfileComplete || false,
            },
          };
        }
      }

      // If token is null, this will trigger logout
      if (!token) {
        console.log("❌ Token is null, triggering logout");
        return null;
      }

      // Return previous token if the access token has not expired yet
      if (token?.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        // Only log occasionally to reduce noise
        if (Math.random() < 0.1) {
          console.log(
              `⏰ Using valid token (expires: ${new Date(
                  token.accessTokenExpires
              ).toLocaleString()})`
          );
        }

        // Always re-sync role and isProfileComplete from DB so that changes
        // made by submitRole() or completeProfile() are immediately reflected
        // in the session without requiring a logout/re-login.
        if (token.user?.email) {
          const dbUser = await db.user.findUnique({
            where: { email: token.user.email },
            select: { role: true, isProfileComplete: true },
          });
          if (dbUser) {
            const roleChanged = dbUser.role !== token.user?.role;
            const profileChanged = dbUser.isProfileComplete !== token.user?.isProfileComplete;
            if (roleChanged || profileChanged) {
              console.log("✅ Session synced from DB into token:", dbUser);
              return {
                ...token,
                user: {
                  ...token.user,
                  role: dbUser.role,
                  isProfileComplete: dbUser.isProfileComplete,
                },
              };
            }
          }
        }

        return token;
      }

      // Access token has expired, try to update it
      console.log(
          `🔄 Token expired, refreshing... (Provider: ${token.provider})`
      );

      let refreshedToken = null;

      if (token.provider === "google") {
        refreshedToken = await refreshGoogleAccessToken(token);
      } else if (token.provider === "credentials") {
        refreshedToken = await refreshCredentialsToken(token);
      }

      // If refresh failed (returns null), this will trigger logout
      if (!refreshedToken) {
        console.log("❌ Token refresh failed, forcing logout");
        return null;
      }

      return refreshedToken;
    },

    async session({ session, token }) {
      // If token is null or has error, return null session (triggers logout)
      if (!token) {
        console.log("❌ No token available, session will be null");
        return null;
      }

      // Populate session with token data
      session.user = token?.user || session.user;
      session.accessToken = token?.accessToken;
      session.provider = token?.provider;

      // Only log occasionally to reduce noise
      if (Math.random() < 0.05) {
        // 5% chance to log
        console.log(`📋 Session created for: ${session.user?.email}`);
      }

      return session;
    },

    async signIn({ user, account, profile }) {
      try {
        console.log("🔐 SignIn callback - Provider:", account?.provider);

        if (account?.provider === "google") {
          console.log("🚀 Processing Google OAuth signin for:", user.email);

          // Check if user already exists
          const existingUser = await db.user.findUnique({
            where: { email: user.email },
          });

          if (!existingUser) {
            console.log("➕ Creating new Google user...");

            await db.user.create({
              data: {
                email: user.email,
                name: user.name,
                image: user.image,
                provider: "google",
                providerId: account.providerAccountId,
                // No password for OAuth users
              },
            });

            console.log("✅ Successfully created Google user");
          } else {
            console.log("✅ Google user exists, updating info...");

            // Update user info from Google (keep existing password if any)
            await db.user.update({
              where: { email: user.email },
              data: {
                name: user.name,
                image: user.image,
                provider: "google",
                providerId: account.providerAccountId,
              },
            });
          }

          return true;
        }

        if (account?.provider === "credentials") {
          console.log("🚀 Processing credentials signin for:", user.email);

          try {
            // Update user provider info
            await db.user.update({
              where: { email: user.email },
              data: {
                provider: "credentials",
                providerId: user.id,
              },
            });
            console.log("✅ Updated credentials user provider info");
          } catch (updateError) {
            // Don't block signin if provider update fails
            console.warn(
                "⚠️ Failed to update provider info:",
                updateError.message
            );
          }

          return true;
        }

        return true;
      } catch (error) {
        console.error("❌ SignIn callback error:", error.message);
        return false;
      }
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === "development",
  // Add event handlers for better error tracking
  events: {
    async signOut(message) {
      console.log("🚪 User signed out:", message?.token?.email || "Unknown user");
    },
    async session(message) {
      // Track when sessions are created/accessed
      if (process.env.NODE_ENV === "development") {
        console.log("📋 Session event:", {
          user: message?.session?.user?.email,
          provider: message?.session?.provider
        });
      }
    }
  }
});