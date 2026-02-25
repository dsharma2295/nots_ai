import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/toast";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
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
          {/*
            Sonner Toaster — styled to match the zinc/dark palette.
            Sits outside ToastProvider intentionally: it renders
            independently via Sonner's global toast() function.
          */}
          <Toaster
            position="bottom-right"
            style={{ "--width": "320px" } as React.CSSProperties}
            toastOptions={{
              style: { maxWidth: "320px" },
              classNames: {
                toast:
                  "!rounded-xl !border !border-zinc-200 !bg-white !shadow-lg !text-[13px] !font-medium !text-zinc-700 dark:!border-zinc-700 dark:!bg-zinc-900 dark:!text-zinc-200",
                actionButton:
                  "!bg-zinc-900 !text-white !text-[11px] !font-semibold !rounded-lg dark:!bg-white dark:!text-zinc-900",
                cancelButton: "!text-zinc-400 !text-[11px] dark:!text-zinc-500",
                success: "!border-emerald-200 dark:!border-emerald-500/20",
                error: "!border-red-200 dark:!border-red-500/20",
                info: "!border-indigo-200 dark:!border-indigo-500/20",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
