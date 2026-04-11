import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Birthday & Cake Tracker",
  description: "Track birthdays and make sure everyone gets a cake!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
