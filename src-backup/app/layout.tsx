import { ToastProvider } from "@/components/signal/toast";
import { ThemeProvider } from "@/components/theme-provider";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Nots.ai — Cut the Noise, Keep the Context",
  description:
    "AI-powered task aggregator that refines fragmented multi-channel communication from Slack, Gmail, and Jira into unified, actionable tasks.",
  openGraph: {
    title: "Nots.ai — Cut the Noise, Keep the Context",
    description: "One dashboard for every task across Slack, Gmail, and Jira.",
    type: "website",
    siteName: "Nots.ai",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
