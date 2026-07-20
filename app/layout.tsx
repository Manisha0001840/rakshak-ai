import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Rakshak AI | Digital Public Safety",
    template: "%s | Rakshak AI",
  },
  description:
    "Rakshak AI helps Indian citizens identify phone scams, digital arrest fraud, fake government documents, and other online threats.",
  keywords: [
    "Rakshak AI",
    "digital public safety",
    "scam detection",
    "digital arrest fraud",
    "cybercrime India",
    "I4C",
  ],
  authors: [{ name: "Rakshak AI" }],
  creator: "Rakshak AI",
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    title: "Rakshak AI | Digital Public Safety",
    description: "Detect scams early. Protect people faster.",
    type: "website",
    siteName: "Rakshak AI",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute -right-40 top-20 h-[28rem] w-[28rem] rounded-full bg-violet-500/10 blur-3xl" />
          <div className="grid-overlay absolute inset-0 opacity-60" />
          <div className="noise-overlay absolute inset-0" />
        </div>
        <div className="relative min-h-screen">{children}</div>
      </body>
    </html>
  );
}
