import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '情報商材クソ記事チェッカー｜買う前に危険度をAI判定',
  description:
    '「これって買う価値ある？」購入する前に要チェック！怪しい情報商材や有料noteの危険度をAIが判定する特化型チェッカーです。副業詐欺や内容の薄いBrain、TipsをAIが瞬時に見抜き、あなたのお金を詐欺リスクから守ります。',
  keywords: [
    '情報商材',
    '副業',
    '詐欺',
    '判定',
    'チェッカー',
    'note',
    'Brain',
    'Tips',
    '評判',
    '見分け方',
    'AI診断',
  ],
  openGraph: {
    title: '情報商材クソ記事チェッカー',
    description: '怪しい情報商材や有料noteの危険度をAIが判定する特化型チェッカー',
    type: 'website',
    locale: 'ja_JP',
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
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: '情報商材クソ記事チェッカー',
    operatingSystem: 'Windows, macOS, Android, iOS',
    applicationCategory: 'BusinessApplication, EducationalApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'JPY',
    },
    description:
      'AIがネット上の情報商材や有料記事の信頼性を100点満点で判定する無料ツール。詐欺リスクの回避や購入判断に役立ちます。',
  };

  return (
    <html lang="ja" className={geist.className}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
