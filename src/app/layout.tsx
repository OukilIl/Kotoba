import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Menu from "@/components/menu";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kotoba - Japanese Learning Toolkit",
  description: "Browser-based Japanese language learning application with text analysis and vocabulary practice tools",
  openGraph: {
    title: "Kotoba - Japanese Learning Toolkit",
    description: "Browser-based Japanese learning tools for text analysis and vocabulary practice",
    url: "https://kotoba-app.xyz",
    siteName: "Kotoba",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kotoba - Japanese Learning Toolkit",
    description: "Powerful browser-based Japanese learning tools for text analysis and vocabulary practice",
  }
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
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Menu />
          <main className="pt-14">
            {children}
          </main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
