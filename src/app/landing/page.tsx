import type { Metadata } from "next";
import LandingClient from "./landing-client";

export const metadata: Metadata = {
  title: "Nots.ai — Cut the Noise, Keep the Context",
  description:
    "One AI pipeline that reads your Slack, Gmail and Jira — continuously — and surfaces what actually needs your attention.",
};

export default function LandingPage() {
  return <LandingClient />;
}
