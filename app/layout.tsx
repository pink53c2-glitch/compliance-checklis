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
  title: "Cybersecurity Compliance Checker | StackGap",
  description: "Free tool that identifies your security gaps and generates a personalized remediation blueprint with recommended SaaS tools.",
  keywords: [
    "cybersecurity compliance",
    "security gap analysis",
    "SOC 2 checklist",
    "ISO 27001 tool",
    "free security audit",
    "NIST compliance checker",
    "IT security assessment",
    "SaaS security tools",
  ],
  authors: [{ name: "StackGap", url: "https://stackgap.xyz" }],
  robots: "index, follow",
  openGraph: {
    title: "Cybersecurity Compliance Checker | StackGap",
    description: "Identify your security gaps and generate a personalized remediation blueprint with recommended SaaS tools.",
    url: "https://stackgap.xyz",
    siteName: "StackGap",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}