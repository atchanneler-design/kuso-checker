import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getRedis } from '@/lib/redis';
import { calcTotal } from '@/lib/score';
import { getVerdict } from '@/lib/verdicts';
import type { StoredResult } from '@/lib/types';
import ResultPanel from '@/components/ResultPanel';

async function fetchResult(id: string): Promise<StoredResult | null> {
  const redis = getRedis();
  if (!redis) return null;
  const raw = await redis.get(`result:${id}`);
  if (!raw) return null;
  return (typeof raw === 'string' ? JSON.parse(raw) : raw) as StoredResult;
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const result = await fetchResult(id);
  if (!result) return { title: 'クソ記事チェッカー' };

  const total = calcTotal(result);
  const verdict = getVerdict(total);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://kuso-checker.vercel.app';
  // Bump NEXT_PUBLIC_OG_VERSION in Vercel env vars whenever the OGP design changes.
  // X (Twitter) caches OGP images aggressively; changing the query string forces a re-fetch.
  // To manually bust the cache for a specific URL, use the Twitter Card Validator:
  //   https://cards-dev.twitter.com/validator
  const ogVersion = process.env.NEXT_PUBLIC_OG_VERSION ?? '3';
  const ogUrl = `${baseUrl}/api/og/${id}?v=${ogVersion}`;

  return {
    title: `【判定結果】${verdict.verdict}（${total}点）｜クソ記事チェッカー`,
    description: result.comment,
    openGraph: {
      title: `【判定結果】${verdict.verdict}（${total}点）｜クソ記事チェッカー`,
      description: result.comment,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `【判定結果】${verdict.verdict}（${total}点）｜クソ記事チェッカー`,
      description: result.comment,
      images: [ogUrl],
    },
  };
}

export default async function ResultPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await fetchResult(id);
  if (!result) notFound();

  return (
    <main className="min-h-screen">
      <div className="bg-gradient-to-br from-red-600 to-red-800 text-white py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-black mb-1">クソ記事チェッカー</h1>
          <p className="text-red-200 text-xs">判定結果のシェアページ</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 pb-12">
        <ResultPanel result={result} id={id} />
      </div>

      <div className="max-w-md mx-auto px-6 pb-12">
        <a
          href="/"
          className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
          自分でも判定してみる（トップへ）
        </a>
      </div>

      <footer className="border-t border-gray-200 py-6 px-4 text-center text-xs text-gray-400">
        <p>判定結果はAIによる自動分析であり、運営者の意見ではありません。</p>
        <p className="mt-1">
          <a href="/disclaimer" className="underline hover:text-gray-600">免責事項</a>
        </p>
      </footer>
    </main>
  );
}
