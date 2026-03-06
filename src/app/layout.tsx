import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
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
    "Monitor and optimize your AI API costs across OpenAI, Anthropic, DeepSeek & OpenRouter. Open-source.",
  metadataBase: new URL("https://llmeter-dun.vercel.app"),
  openGraph: {
    title: "LLMeter — Control your AI spend across all providers",
    description:
      "Open-source LLM cost monitoring. Track spend across OpenAI, Anthropic, DeepSeek & OpenRouter in real-time.",
    url: "https://llmeter-dun.vercel.app",
    siteName: "LLMeter",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LLMeter — AI Cost Monitor Dashboard",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LLMeter — Control your AI spend across all providers",
    description:
      "Open-source LLM cost monitoring across OpenAI, Anthropic, DeepSeek & OpenRouter.",
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
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
