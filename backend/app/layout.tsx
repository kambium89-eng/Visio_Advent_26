import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Visio Advent 2026 – Teamzugang",
  description: "Geschützter Datenspeicher für unseren Adventskalender.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="antialiased">{children}</body>
    </html>
  );
}
