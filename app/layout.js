import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { Inter } from "next/font/google";
import { Delius } from "next/font/google";

import Head from "next/head"; // ✅ Import Head
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const poppins = Inter({ subsets: ["latin"], variable: "--font-poppins" });

const delius = Delius({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-delius",
});
export const metadata = {
  title: "JUSTLearn",
  description: "Explore || Learn || Build || Share",
};

export default async function RootLayout({ children }) {
  // const conn = await dbConnect();
  return (
    <html lang="en" className="dark">
      <Head>
      
        <link
          rel="preload"
          as="fetch"
          href="/hero-animation.json"
          type="application/json"
          crossOrigin="anonymous"
        />
      </Head>
      <body className={cn(inter.className, poppins.className, delius.variable)}>
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
