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
    <html lang="en" suppressHydrationWarning>
      <head suppressHydrationWarning>
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
            // Suppress all wallet extension errors immediately
            (function() {
              const originalError = console.error;
              const originalWarn = console.warn;
              
              console.error = function(...args) {
                const errorMsg = args[0]?.toString() || '';
                const errorStack = args[0]?.stack?.toString() || '';
                
                // Ignore all wallet extension related errors
                if (errorMsg.includes('chrome-extension://') ||
                    errorMsg.includes('moz-extension://') ||
                    errorMsg.includes('solana.js') ||
                    errorMsg.includes('btc.js') ||
                    errorMsg.includes('sui.js') ||
                    errorMsg.includes('extensionPageScript.js') ||
                    errorMsg.includes('Cannot redefine property') ||
                    errorMsg.includes('Cannot assign to read only property') ||
                    errorMsg.includes('evmAsk.js') ||
                    errorMsg.includes('t is not a function') ||
                    errorMsg.includes('registerSolanaInjectedWallet') ||
                    errorMsg.includes('initSolanaConnect') ||
                    errorStack.includes('chrome-extension://') ||
                    errorStack.includes('moz-extension://')) {
                  return;
                }
                originalError.apply(console, args);
              };
              
              console.warn = function(...args) {
                const warnMsg = args[0]?.toString() || '';
                if (warnMsg.includes('chrome-extension://') || 
                    warnMsg.includes('moz-extension://')) {
                  return;
                }
                originalWarn.apply(console, args);
              };
              
              // Suppress unhandled promise rejections from extensions
              window.addEventListener('unhandledrejection', function(event) {
                const reason = event.reason?.toString() || '';
                if (reason.includes('chrome-extension://') || 
                    reason.includes('moz-extension://')) {
                  event.preventDefault();
                }
              });
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
