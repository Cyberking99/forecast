import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { WalletConnectButton } from "@/shared/ui/WalletConnectButton";

import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Forecast — Prediction Pool",
  description: "Web3 prediction pool powered by Venice AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="app-shell">
            <header className="app-header">
              <div className="app-header-inner">
                <Link href="/" className="logo">
                  <span className="logo-icon">F</span>
                  Forecast
                </Link>
                <div className="header-actions">
                <WalletConnectButton />
                <Link href="/create" className="btn btn-primary">Create Prediction</Link>
                </div>
              </div>
            </header>
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
