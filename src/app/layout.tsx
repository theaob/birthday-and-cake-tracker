import type { Metadata } from "next";
import "./globals.css";
import { auth } from "@/auth";
import SignOutButton from "@/components/SignOutButton";

export const metadata: Metadata = {
  title: "Birthday & Cake Tracker",
  description: "Track birthdays and make sure everyone gets a cake!",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en">
      <body>
        {session?.user && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: "12px",
              padding: "10px 24px",
              fontSize: "0.85rem",
              borderBottom: "1px solid var(--border-color)",
            }}
          >
            <span style={{ color: "var(--text-secondary)" }}>
              Signed in as {session.user.email ?? session.user.name}
            </span>
            <SignOutButton />
          </div>
        )}
        {children}
      </body>
    </html>
  );
}
