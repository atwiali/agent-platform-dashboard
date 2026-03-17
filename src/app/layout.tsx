import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Agent Platform Dashboard",
    template: "%s | Agent Platform",
  },
  description:
    "A unified production dashboard for managing AI agents with real-time streaming chat, usage analytics, evaluation suite, and security layers. Built with Next.js 15 and the Anthropic SDK.",
  keywords: [
    "AI agents",
    "Claude",
    "Anthropic",
    "dashboard",
    "streaming chat",
    "LLM",
    "evaluation",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <div className="flex h-screen overflow-hidden bg-background">
          <Sidebar />
          <main className="flex-1 overflow-hidden">{children}</main>
        </div>
      </body>
    </html>
  );
}
