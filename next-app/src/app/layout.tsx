import type { Metadata } from "next";
import { Public_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: 'JobTracker Pro — AI-Powered Job Search Manager',
    template: '%s | JobTracker Pro',
  },
  description: 'The smartest AI-powered job application tracker. Kanban pipeline, Gemini interview coach, Gmail auto-sync, voice prep bot, and Chrome extension — all in one.',
  keywords: ['job tracker', 'job application manager', 'AI interview prep', 'career management', 'job search'],
  openGraph: {
    title: 'JobTracker Pro — AI-Powered Job Search Manager',
    description: 'Track applications, ace interviews, and land your dream job.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@100..700,0..1&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`${publicSans.variable} font-display antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
