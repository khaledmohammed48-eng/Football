import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';

export const dynamic = 'force-dynamic';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'أكاديمتنا | My Academy',
  description: 'إدارة الأكاديمية — اللاعبون والمدربون والفرق',
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
      </body>
    </html>
  );
}
