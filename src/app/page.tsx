import LandingClient from "./landing/landing-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nots.ai — Cut the Noise, Keep the Context",
  description: "One AI pipeline that reads your Slack, Gmail and Jira and surfaces what actually needs your attention.",
};

export default function RootPage() {
  return <LandingClient />;
}
