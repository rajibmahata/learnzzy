import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "../styles/globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastProvider } from "@/components/ui/Toast";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["500", "700", "800"] });

export const metadata: Metadata = {
  title: "Learnzzy — Play. Think. Learn.",
  description:
    "Tiny games. Big learning. Simple educational adventures designed for curious kids.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon-192.png",
  },
  openGraph: {
    title: "Learnzzy — Play. Think. Learn.",
    description: "Tiny games. Big learning.",
    type: "website",
  },
  keywords: ["kids", "learning", "educational games", "addition", "subtraction", "puzzle", "PWA"],
  authors: [{ name: "Learnzzy" }],
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Allow pinch-zoom (WCAG 1.4.4). Child controls are large enough that
  // blocking zoom is unnecessary and hurts adult/parent accessibility.
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#f8f9ff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.className} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Material Symbols: display=swap + preconnect so cold/offline start
            never blocks paint. Plus Jakarta Sans is self-hosted via next/font. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="pt-safe pb-safe min-h-screen">
        <ErrorBoundary>
          <ToastProvider>
            <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:p-2 focus:bg-white">
              Skip to content
            </a>
            <main id="main">{children}</main>
            <script
              dangerouslySetInnerHTML={{
                __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{})})}` +
                  `try{var l=localStorage.getItem('learnzzy.locale');if(l&&document.documentElement.lang!==l){document.documentElement.lang=l}}catch(e){}`,
              }}
            />
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
