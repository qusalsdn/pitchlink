import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PitchLink",
  description: "PitchLink",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="max-w-[1024px] w-full mx-auto">{children}</body>
    </html>
  );
}
