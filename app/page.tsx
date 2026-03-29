'use client';

import { useState, useEffect, useCallback } from 'react';
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
  const [resultId, setResultId] = useState<string | undefined>(undefined);
  const [error, setError] = useState('');
  const [remaining, setRemaining] = useState<number | null>(null);

  const fetchRemaining = useCallback(async () => {
    try {
      const res = await fetch('/api/remaining');
      const data = await res.json() as { remaining: number };
      setRemaining(data.remaining);
    } catch {
      // ignore — UI degrades gracefully without the count
    }
  }, []);

  useEffect(() => {
    fetchRemaining();
  }, [fetchRemaining]);

  async function handleSubmit(text: string) {
    setLoading(true);
    setError('');
    setResult(null);
    setResultId(undefined);

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
      setResultId(data.id);
      setTimeout(() => {
        document.getElementById('result')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch {
      setError('判定に失敗しました。もう一度お試しください。');
    } finally {
      setLoading(false);
      fetchRemaining();
    }
  }

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-br from-red-600 to-red-800 text-white py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-black mb-2">クソ記事チェッカー</h1>
          <p className="text-red-100 text-sm font-medium leading-relaxed mt-3">
            <strong>「これって買う価値ある？」</strong><br />
            怪しい情報商材や高額な有料記事の危険度をAIが判定します。<br />
            購入する前に無料公開部分をコピペして、中身の薄さや詐欺リスクを確かめましょう。
          </p>
          <p className="text-red-300/70 text-xs mt-2">
            1日3回まで無料で利用できます（JST 0時リセット）
          </p>
        </div>
      </div>

      {/* Input */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <InputPanel onSubmit={handleSubmit} loading={loading} remaining={remaining} />
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
          <ResultPanel result={result} id={resultId} />
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
