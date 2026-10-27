import type { Metadata } from "next";
import "./globals.css";
import { ThemeBootstrap } from "@/components/platform/theme-bootstrap";

export const metadata: Metadata = {
  title: "LedgerDesk — Business Operations",
  description: "Inventory, invoicing and agency operations in one focused workspace.",
  applicationName: "LedgerDesk",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><ThemeBootstrap/><a href="#main-content" className="skip-link">Skip to main content</a>{children}</body>
    </html>
  );
}
