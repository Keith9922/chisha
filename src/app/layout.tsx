import type { Metadata, Viewport } from "next";
import { IBM_Plex_Serif } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import { ToastProvider } from "@/components/Toast";

const plexSerif = IBM_Plex_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "吃啥 / chisha",
    template: "%s · 吃啥",
  },
  description: "对话式饮食与运动记录 — 给一二线城市白领的极简健身教练",
  manifest: "/manifest.json",
  applicationName: "吃啥",
  appleWebApp: {
    capable: true,
    title: "吃啥",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icon.svg", sizes: "192x192", type: "image/svg+xml" },
    ],
  },
  openGraph: {
    title: "吃啥 / chisha",
    description: "对话式饮食与运动记录 — 给一二线城市白领的极简健身教练",
    type: "website",
    siteName: "吃啥",
    locale: "zh_CN",
  },
  twitter: {
    card: "summary",
    title: "吃啥 / chisha",
    description: "对话式饮食与运动记录",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF7F2" },
    { media: "(prefers-color-scheme: dark)", color: "#FAF7F2" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${plexSerif.variable}`}>
      <body className="min-h-screen flex flex-col">
        <ToastProvider>
          <main className="flex-1 max-w-[480px] w-full mx-auto pb-20">
            {children}
          </main>
          <BottomNav />
        </ToastProvider>
      </body>
    </html>
  );
}
