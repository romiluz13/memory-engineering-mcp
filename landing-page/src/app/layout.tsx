import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Memory Engineering MCP - Persistent Memory for AI Assistants",
  description: "Give your AI assistants persistent memory across sessions. Never lose context again with MongoDB-powered memory system for Cursor, Cline, and MCP clients.",
  keywords: "AI memory, MCP, Model Context Protocol, persistent context, Cursor, Cline, MongoDB, AI development",
  authors: [{ name: "Memory Engineering Team" }],
  openGraph: {
    title: "Memory Engineering MCP",
    description: "Your AI Never Forgets - 10x faster development with persistent memory",
    type: "website",
    url: "https://memory-engineering-mcp.vercel.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "Memory Engineering MCP",
    description: "Your AI Never Forgets - 10x faster development with persistent memory",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}