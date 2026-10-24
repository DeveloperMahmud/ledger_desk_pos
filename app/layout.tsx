import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ledgerly — Business Operations",
  description: "Inventory, invoicing and agency operations in one focused workspace.",
  applicationName: "Ledgerly",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><a href="#main-content" className="skip-link">Skip to main content</a>{children}</body>
    </html>
  );
}
