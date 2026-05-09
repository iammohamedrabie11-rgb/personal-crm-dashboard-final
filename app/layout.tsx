import type { Metadata } from "next";
import "./globals.css";
import { AuthShell } from "@/components/AuthShell";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "Personal CRM Dashboard",
  description: "Track leads, income, and follow-ups",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="theme-app bg-slate-950 text-slate-100">
        <ThemeProvider>
          <AuthShell>{children}</AuthShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
