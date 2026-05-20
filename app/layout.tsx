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
      <body className="w-full">
        <div className="max-w-[1024px] w-full mx-auto flex flex-col">{children}</div>
      </body>
    </html>
  );
}
