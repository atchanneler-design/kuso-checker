import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'クソ記事チェッカー｜AI・情報商材の危険度を判定',
  description:
    'AIや副業系の怪しい記事・情報商材を8軸でスコアリング。誇大表現・N1体験談・有害度などを判定します。',
  openGraph: {
    title: 'クソ記事チェッカー',
    description: 'AIや副業系の怪しい記事の危険度を判定するツール',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'クソ記事チェッカー',
    description: 'AIや副業系の怪しい記事の危険度を判定するツール',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={geist.className}>
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
