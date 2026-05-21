import type { Metadata } from "next";
import "./globals.css";
import { SplashScreen } from "@/components/splash-screen";

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
        <div className="max-w-[1024px] w-full mx-auto flex flex-col">
          <SplashScreen>{children}</SplashScreen>
        </div>
      </body>
    </html>
  );
}
