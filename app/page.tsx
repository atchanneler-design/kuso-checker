'use client';

import { useState } from 'react';
import InputPanel from '@/components/InputPanel';
import ResultPanel from '@/components/ResultPanel';

type ApiResult = {
  harm: number;
  exaggeration: number;
  n1hype: number;
  originality: number;
  solution_hiding: number;
  social_proof_fake: number;
  ai_slop: number;
  clickbait: number;
  comment: string;
  merit: string | null;
  evidence: string[];
  price_warning: string | null;
  good_layer: string | null;
  kuso_layer: string | null;
  how_to_use: string | null;
};

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [error, setError] = useState('');

  async function handleSubmit(text: string) {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '判定に失敗しました。もう一度お試しください。');
        return;
      }

      setResult(data);
      setTimeout(() => {
        document.getElementById('result')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch {
      setError('判定に失敗しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-br from-red-600 to-red-800 text-white py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-black mb-2">クソ記事チェッカー</h1>
          <p className="text-red-200 text-sm">
            AI・情報商材系の記事を8軸でスコアリングして危険度を判定します
          </p>
        </div>
      </div>

      {/* Input */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <InputPanel onSubmit={handleSubmit} loading={loading} />
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Result */}
      {result && (
        <div id="result" className="max-w-2xl mx-auto px-4 pb-12">
          <ResultPanel result={result} />
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6 px-4 text-center text-xs text-gray-400">
        <p>
          判定結果はAIによる自動分析であり、運営者の意見ではありません。
          参考情報としてご活用ください。
        </p>
        <p className="mt-1">
          <a href="/disclaimer" className="underline hover:text-gray-600">
            免責事項
          </a>
        </p>
      </footer>
    </main>
  );
}
