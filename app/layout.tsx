import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { WalletProvider } from "@/contexts/WalletContext";
import LoadingScreen from "@/components/LoadingScreen";

import '@/lib/security/runtime-check';

export const metadata: Metadata = {
  title: "WinScan",
  description: "Multi-chain blockchain explorer powered by WinScan",
  icons: {
    icon: '/logo.svg',
    apple: '/logo.svg',
  },
  manifest: '/manifest.json',
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to critical domains */}
        <link rel="preconnect" href="https://ssl.winsnip.xyz" />
        <link rel="preconnect" href="https://ssl2.winsnip.xyz" />
        <link rel="dns-prefetch" href="https://ssl.winsnip.xyz" />
        <link rel="dns-prefetch" href="https://ssl2.winsnip.xyz" />
        
        {/* Preload critical resources */}
        <link rel="preload" href="/icon.svg" as="image" type="image/svg+xml" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{
          __html: `
            // Suppress wallet extension errors
            (function() {
              const originalError = console.error;
              console.error = function(...args) {
                const errorMsg = args[0]?.toString() || '';
                // Ignore wallet extension property redefinition errors
                if (errorMsg.includes('Cannot redefine property: ethereum') ||
                    errorMsg.includes('evmAsk.js') ||
                    errorMsg.includes('chrome-extension://')) {
                  return;
                }
                originalError.apply(console, args);
              };
            })();
          `
        }} />
        <LoadingScreen />
        <LanguageProvider>
          <WalletProvider>
            {children}
          </WalletProvider>
        </LanguageProvider>
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js', {
                  updateViaCache: 'none',
                  scope: '/'
                }).then(function(registration) {
                  // Check for updates setiap 1 jam, tidak agresif
                  setInterval(function() {
                    registration.update();
                  }, 60 * 60 * 1000);
                }).catch(function(error) {
                  });
              });
            }
          `
        }} />
      </body>
    </html>
  );
}
