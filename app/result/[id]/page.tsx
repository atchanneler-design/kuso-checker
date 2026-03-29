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

  return {
    title: `${verdict.verdict}（${total}点）｜クソ記事チェッカー`,
    description: result.comment,
    openGraph: {
      title: `${verdict.verdict}（${total}点）｜クソ記事チェッカー`,
      description: result.comment,
      images: [{ url: `${baseUrl}/api/og/${id}?v=2`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${verdict.verdict}（${total}点）｜クソ記事チェッカー`,
      description: result.comment,
      images: [`${baseUrl}/api/og/${id}?v=2`],
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

      <div className="text-center pb-8">
        <a href="/" className="text-sm text-red-600 hover:underline">
          自分でも判定してみる →
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
