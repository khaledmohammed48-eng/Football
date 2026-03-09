import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

export const dynamic = 'force-dynamic';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://web-production-2835e.up.railway.app'
  ),
  title: 'أكاديمتنا',
  description: 'إدارة الأكاديمية — اللاعبون والمدربون والفرق',
  manifest: '/manifest.json',
  themeColor: '#16a34a',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'أكاديمتنا',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'أكاديمتنا',
    description: 'إدارة الأكاديمية — اللاعبون والمدربون والفرق',
    type: 'website',
    locale: 'ar_SA',
    images: [
      {
        url: '/icons/icon-512x512.png',
        width: 512,
        height: 512,
        alt: 'أكاديمتنا',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'أكاديمتنا',
    description: 'إدارة الأكاديمية — اللاعبون والمدربون والفرق',
    images: ['/icons/icon-512x512.png'],
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="min-h-screen bg-background font-cairo antialiased">
        {children}
        <Script id="register-sw" strategy="afterInteractive">{`
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js').catch(() => {});
            });
          }
        `}</Script>
      </body>
    </html>
  );
}
