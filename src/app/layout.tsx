import type { Metadata } from "next";
import Link from "next/link";
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
  title: "AI Governance Path",
  description: "A paced, streak-driven path through AI governance interview prep.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900">
        <header className="border-b border-zinc-200 bg-white">
          <nav className="mx-auto flex max-w-3xl items-center gap-6 px-4 py-3 text-sm font-medium">
            <Link href="/" className="font-semibold text-zinc-900">
              AI Governance Path
            </Link>
            <Link href="/" className="text-zinc-600 hover:text-zinc-900">
              Dashboard
            </Link>
            <Link href="/log" className="text-zinc-600 hover:text-zinc-900">
              Log
            </Link>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
