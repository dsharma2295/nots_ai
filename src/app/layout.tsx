import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/toast";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

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
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
