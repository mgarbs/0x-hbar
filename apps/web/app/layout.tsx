import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "0x-hbar · HBAR → EVM router",
  description:
    "Real-time monitoring console for the 0x-hbar service — routes Hedera exchange withdrawals to EVM 0x addresses via memo, with a 2% treasury fee.",
  icons: [
    {
      rel: "icon",
      url:
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' rx='10' fill='%230A0B10'/%3E%3Cpath d='M14 12v24h4V26h12v10h4V12h-4v10H18V12z' fill='%238259EF'/%3E%3C/svg%3E",
    },
  ],
};

export const viewport: Viewport = {
  themeColor: "#06070B",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${plexSans.variable} ${plexMono.variable}`}>
      <body className="min-h-screen antialiased bg-surface-deep text-ink font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
