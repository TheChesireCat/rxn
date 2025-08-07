import type { Metadata } from "next";
import { Noto_Sans_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const notoSansMono = Noto_Sans_Mono({
  variable: "--font-noto-sans-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "ChainReaction++",
  description: "A clone of the classic Chain Reaction game",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🔮</text></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@300..700&family=Nata+Sans:wght@100..900&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`${notoSansMono.variable} antialiased`}
        style={{ fontFamily: "'Nata Sans', sans-serif" }}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
