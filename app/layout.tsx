import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '情報商材クソ記事チェッカー｜買う前に危険度をAI判定',
  description:
    '「これって買う価値ある？」購入する前に要チェック！怪しい情報商材や有料noteの危険度をAIが判定する特化型チェッカーです。無料公開部分をコピペするだけで、詐欺リスクや内容の薄さを見抜き、あなたのお金を守ります。',
  openGraph: {
    title: '情報商材クソ記事チェッカー',
    description: '怪しい情報商材や有料noteの危険度をAIが判定する特化型チェッカー',
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
        <Analytics />
      </body>
    </html>
  );
}
