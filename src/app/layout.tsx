import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nots.ai — Cut the Noise, Keep the Context",
  description:
    "AI-powered task aggregator that refines fragmented multi-channel communication from Slack, Gmail, and Jira into unified, actionable tasks.",
  openGraph: {
    title: "Nots.ai — Cut the Noise, Keep the Context",
    description:
      "One dashboard for every task across Slack, Gmail, and Jira. AI-powered noise filtering and semantic grouping.",
    type: "website",
    siteName: "Nots.ai",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nots.ai — Cut the Noise, Keep the Context",
    description: "One dashboard for every task across Slack, Gmail, and Jira.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} bg-zinc-950 text-zinc-100 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
