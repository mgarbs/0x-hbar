import type { Metadata, Viewport } from "next";
import { Fraunces, Figtree, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["300", "500", "700", "900"],
  style: ["normal", "italic"],
});

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "0x-hbar · exchange → EVM HBAR router",
  description:
    "Production-grade explorer for the 0x-hbar service — routes exchange HBAR withdrawals to EVM 0x addresses via memo, with 2% treasury fee. Live on Hedera testnet.",
  icons: [
    {
      rel: "icon",
      url:
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' rx='12' fill='%230B0B12'/%3E%3Cpath d='M14 12v24h4V26h12v10h4V12h-4v10H18V12z' fill='%238259EF'/%3E%3C/svg%3E",
    },
  ],
};

export const viewport: Viewport = {
  themeColor: "#07070B",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${fraunces.variable} ${figtree.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen antialiased bg-surface-deep text-ink font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
