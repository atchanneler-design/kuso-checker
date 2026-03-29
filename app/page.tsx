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
          <div className="mt-5 flex justify-center">
            <span className="inline-block bg-black/20 text-white/90 text-xs font-medium px-4 py-1.5 rounded-full ring-1 ring-white/20">
              1日3回まで無料で利用できます（JST 0時リセット）
            </span>
          </div>
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

      {/* SEO Content Section */}
      <div className="max-w-2xl mx-auto px-4 pb-20 space-y-12">
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-red-600 rounded-full"></span>
            AI判定の仕組み
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            本ツールは、Claude 3.1 Proなど最新のAI技術を活用し、ネット上の情報商材や有料記事（note, Brain, Tips等）の「構成パターン」「語彙の選択」「論理の飛躍」を解析します。100点に近いほど、典型的な「中身の薄い商材」や「誇大広告」の傾向が強いことを示しています。
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-red-600 rounded-full"></span>
            怪しい商材に共通する5つのパターン
          </h2>
          <div className="grid grid-cols-1 gap-4 text-sm">
            <div className="p-4 bg-white border border-gray-100 rounded-lg shadow-sm">
              <h3 className="font-bold text-red-600 mb-1">1. 特定の「煽りワード」の多用</h3>
              <p className="text-gray-600">「初月から〇〇万」「誰でも簡単に」「最短最速」「神」などの射幸心を煽るワードが連発されている。</p>
            </div>
            <div className="p-4 bg-white border border-gray-100 rounded-lg shadow-sm">
              <h3 className="font-bold text-red-600 mb-1">2. 解決策の後出し（囲い込み）</h3>
              <p className="text-gray-600">「続きはメルマガで」「詳しくは公式LINEで」など、本質的なノウハウが外部誘導の先に隠されている。</p>
            </div>
            <div className="p-4 bg-white border border-gray-100 rounded-lg shadow-sm">
              <h3 className="font-bold text-red-600 mb-1">3. 検証不可能な実績（社会的証明の偽装）</h3>
              <p className="text-gray-600">「累計1,000部突破」「満足度99%」など、第三者が客観的に確認できない数字を並べる手法。</p>
            </div>
            <div className="p-4 bg-white border border-gray-100 rounded-lg shadow-sm">
              <h3 className="font-bold text-red-600 mb-1">4. N1の成功体験を一般化</h3>
              <p className="text-gray-600">特定の一人だけが成功した事例（生存バイアス）を、科学的根拠なしに「再現性がある」と主張している。</p>
            </div>
            <div className="p-4 bg-white border border-gray-100 rounded-lg shadow-sm">
              <h3 className="font-bold text-red-600 mb-1">5. AI（ChatGPT等）による量産記事</h3>
              <p className="text-gray-600">人間らしい独創的な視点や具体的な一次情報がなく、AIが生成したような無難な正論の寄せ集めになっている。</p>
            </div>
          </div>
        </section>

        <section className="bg-gray-100 rounded-xl p-6 text-center">
          <h2 className="text-lg font-bold text-gray-800 mb-2">
            大切なお金と時間を守るために
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            ネット上の情報は玉石混交です。怪しいと感じたら、まずは「クソ記事チェッカー」でAIの客観的な意見を確認してみてください。
          </p>
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-xs font-bold text-red-600 hover:text-red-700 underline"
          >
            ↑ 判定フォームへ戻る
          </button>
        </section>
      </div>

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
