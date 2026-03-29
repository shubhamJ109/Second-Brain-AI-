import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Second Brain AI | Emerald Edition",
  description: "A professional, vision-augmented RAG interface powered by Gemini.",
  icons: {
    icon: "/icon.svg?v=2",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-background text-foreground`}>
        {children}
      </body>
    </html>
  );
}
