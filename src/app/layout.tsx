import type { Metadata } from "next";
import Script from "next/script";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://www.llmeter.org/#organization",
  name: "LLMeter",
  alternateName: "Simplifai LLMeter",
  url: "https://www.llmeter.org",
  logo: {
    "@type": "ImageObject",
    url: "https://www.llmeter.org/og-image.png",
    width: 1200,
    height: 630,
  },
  description:
    "Open-source LLM cost monitoring. Track usage and spend across OpenAI, Anthropic, DeepSeek, OpenRouter, Mistral, and Azure OpenAI from one dashboard.",
  email: "hello@llmeter.org",
  sameAs: [
    "https://github.com/amedinat/LLMeter",
    "https://simplifai.tools",
  ],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://www.llmeter.org/#website",
  url: "https://www.llmeter.org",
  name: "LLMeter",
  description: "Open-source LLM cost monitoring",
  publisher: { "@id": "https://www.llmeter.org/#organization" },
  inLanguage: "en-US",
};

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LLMeter — OpenAI & AI Cost Tracking Dashboard",
  description:
    "Stop guessing your AI bill. Monitor API costs across OpenAI, Anthropic & DeepSeek. Open-source dashboard with real-time budget alerts.",
  metadataBase: new URL("https://www.llmeter.org"),
  alternates: {
    canonical: "https://www.llmeter.org",
  },
  openGraph: {
    title: "LLMeter — Stop Guessing Your AI Bill",
    description:
      "Open-source AI cost dashboard. Track billing and API usage across OpenAI, Anthropic, DeepSeek & OpenRouter in real-time.",
    url: "https://www.llmeter.org",
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
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        {plausibleDomain && (
          <Script
            defer
            data-domain={plausibleDomain}
            src="https://plausible.io/js/script.js"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body
        className={`${plusJakarta.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
        <Toaster richColors position="top-right" />
        <Analytics />
      </body>
    </html>
  );
}
