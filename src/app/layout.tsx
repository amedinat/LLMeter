import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LLMeter — OpenAI & AI Cost Tracking Dashboard",
  description:
    "Stop guessing your AI bill. Monitor and optimize API costs across OpenAI, Anthropic, DeepSeek & OpenRouter. Open-source cost dashboard with budget alerts and usage tracking.",
  metadataBase: new URL("https://llmeter.org"),
  openGraph: {
    title: "LLMeter — Stop Guessing Your AI Bill",
    description:
      "Open-source AI cost dashboard. Track billing and API usage across OpenAI, Anthropic, DeepSeek & OpenRouter in real-time.",
    url: "https://llmeter.org",
    siteName: "LLMeter",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LLMeter — AI Cost Tracking Dashboard",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LLMeter — Stop Guessing Your AI Bill",
    description:
      "Open-source AI cost dashboard. Track billing across OpenAI, Anthropic, DeepSeek & OpenRouter.",
    images: ["/og-image.png"],
  },
  keywords: [
    "LLM",
    "cost tracking",
    "AI monitoring",
    "OpenAI",
    "Anthropic",
    "DeepSeek",
    "OpenRouter",
    "open source",
    "developer tools",
    "OpenAI billing",
    "AI cost dashboard",
    "API usage tracking",
    "LLM cost monitor",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {plausibleDomain && (
        <head>
          <Script
            defer
            data-domain={plausibleDomain}
            src="https://plausible.io/js/script.js"
            strategy="afterInteractive"
          />
        </head>
      )}
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
