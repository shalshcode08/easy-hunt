import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hunt It",
  description: "Your unified job board",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
