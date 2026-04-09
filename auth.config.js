export const authConfig = {
    session: {
     strategy: 'jwt',
    },
    providers: [],
    callbacks: {
      async jwt({ token, user, account }) {
        // On initial sign-in, the user object is available.
        // NOTE: auth.js's richer jwt callback runs for actual sign-ins and
        // stores the full user (with role, isProfileComplete) into token.user.
        // This authConfig jwt callback is used by the middleware — it must
        // preserve whatever is already in token.user rather than overwriting it.
        if (user && !token.user) {
          // Only set from user object if token.user isn't already populated
          // (auth.js's callback populates it with the full DB data)
          token.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role ?? null,
            isProfileComplete: user.isProfileComplete ?? false,
          };
        }
        // Always pass the full token through (preserve token.user as-is)
        return token;
      },
      async session({ session, token }) {
        // Forward token.user (which includes role) into session.user
        session.user = token?.user || session.user;
        session.accessToken = token?.accessToken;
        session.provider = token?.provider;
        return session;
      },
    },
 }
