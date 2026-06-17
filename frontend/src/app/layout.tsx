import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ATS Friendly — AI Career Agent",
  description: "Let AI tailor your resume and cover letter for every job.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
