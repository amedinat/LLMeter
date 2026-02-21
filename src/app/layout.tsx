import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LLMeter — AI Cost Monitor",
  description:
    "Monitor and optimize your AI API costs across OpenAI, Anthropic, and more.",
  metadataBase: new URL("https://llmeter-dun.vercel.app"),
  openGraph: {
    title: "LLMeter — AI Cost Monitor",
    description:
      "Monitor and optimize your AI API costs across OpenAI, Anthropic, and more.",
    siteName: "LLMeter",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LLMeter — AI Cost Monitor",
    description:
      "Monitor and optimize your AI API costs across OpenAI, Anthropic, and more.",
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
