import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Banking Management System",
  description: "A secure web-based banking management simulation system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-100">
        {children}
      </body>
    </html>
  );
}
