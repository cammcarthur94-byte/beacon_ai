import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Beacon | AI Search Visibility & Recommendation Rate",
  description:
    "Track your brand's AI search visibility, recommendation rate, and customer sentiment across ChatGPT, Google Gemini, Anthropic Claude, and Perplexity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased font-sans scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.cdnfonts.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.cdnfonts.com/css/google-sans-2"
          rel="stylesheet"
        />
        <link
          href="https://fonts.cdnfonts.com/css/google-sans"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Product+Sans:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-white text-zinc-900 selection:bg-emerald-100 selection:text-emerald-950 font-sans">
        {children}
        <Toaster position="bottom-right" theme="light" />
      </body>
    </html>
  );
}
