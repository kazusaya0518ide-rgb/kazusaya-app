import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "かずさや発注アプリ",
  description: "かずさや 受発注管理システム",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
