import "@/styles/globals.css";
import "@/styles/rich-text.css";
import { SpeedInsights } from "@vercel/speed-insights/next"
import type { Metadata } from 'next';
import { Geist } from "next/font/google";

import { auth } from '@/auth';
import { Analytics, GoogleTagManager } from "@/components/analytics";
import { ClientLayout } from "@/components/client-layout";
import { HeadScripts, BodyStartScripts, BodyEndScripts } from "@/components/layout/ScriptInjector";
import { BackTop } from "@/components/ui/BackTop";
import { FloatingFavorites } from "@/components/ui/FloatingFavorites";

const geist = Geist({
  subsets: ["latin"],

});

// Get verification ID from environment variables
const BING_WEBMASTER_ID = process.env.NEXT_PUBLIC_BING_WEBMASTER_ID || '';
const IMPACT_SITE_VERIFICATION = process.env.NEXT_PUBLIC_IMPACT_SITE_VERIFICATION || '';

export const metadata: Metadata = {
  title: "Oohunt - Your Ultimate Shopping Companion",
  description: "Find the best deals on Amazon, Walmart, Target and more",
  icons: {
    icon: "/favicon.ico",
  },
  verification: {
    other: {
      'msvalidate.01': BING_WEBMASTER_ID,
      'impact-site-verification': IMPACT_SITE_VERIFICATION
    },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Preload session info
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning className={geist.className}>
      <head>
        {/* Inject custom scripts in head */}
        <HeadScripts />
      </head>
      <body>
        <GoogleTagManager />
        {/* Inject custom scripts at the beginning of body */}
        <BodyStartScripts />
        <ClientLayout session={session}>
          {children}
          <BackTop />
          <FloatingFavorites />
        </ClientLayout>
        <Analytics />
        <SpeedInsights />
        {/* Inject custom scripts at the end of body */}
        <BodyEndScripts />
      </body>
    </html>
  );
}
