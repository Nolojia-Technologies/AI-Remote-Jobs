import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Hustle Academy — Admin",
  description: "Content & operations portal for AI Hustle Academy.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-muted/30 antialiased">{children}</body>
    </html>
  );
}
