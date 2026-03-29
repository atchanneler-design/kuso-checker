'use client';

import { useEffect, useState } from 'react';
import { calcTotal, calcDisplayScores, type AxisScores } from '@/lib/score';
import { getVerdict } from '@/lib/verdicts';
import ScoreMeter from './ScoreMeter';
import RadarChart from './RadarChart';
import EvidenceList from './EvidenceList';
import DownloadImageButton from './DownloadImageButton';

type ApiResult = AxisScores & {
  comment: string;
  merit: string | null;
  evidence: string[];
  price_warning: string | null;
  good_layer: string | null;
  kuso_layer: string | null;
  how_to_use: string | null;
};

type Props = {
  result: ApiResult;
  id?: string;
};

export default function ResultPanel({ result, id }: Props) {
  const total = calcTotal(result);
  const displayScores = calcDisplayScores(result);
  const verdict = getVerdict(total);

  const [displayTotal, setDisplayTotal] = useState(0);

  useEffect(() => {
    setDisplayTotal(0);
    const duration = 1000;
    const steps = 60;
    const increment = total / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const current = Math.min(Math.round(increment * step), total);
      setDisplayTotal(current);
      if (step >= steps) clearInterval(timer);
    }, duration / steps);

    return () => clearInterval(timer);
  }, [total]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div
        className="rounded-xl p-6 text-white text-center"
        style={{ backgroundColor: verdict.color }}
      >
        <div className="inline-block bg-white/20 rounded-full px-4 py-1 text-sm font-bold mb-3">
          {verdict.label}
        </div>
        <div className="text-6xl font-black mb-2">{displayTotal}</div>
        <div className="text-2xl font-bold mb-2">{verdict.verdict}</div>
        <p className="text-sm italic opacity-90">{verdict.roast}</p>
      </div>

      {/* Score Meter */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <ScoreMeter score={total} />
      </div>

      {/* Radar Chart */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-4 text-center">
          クソ度分析レーダー
        </h3>
        <RadarChart scores={displayScores} />
      </div>

      {/* Comment */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-3">
        <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide">総評</h3>
        <p className="text-gray-800 leading-relaxed">{result.comment}</p>
        {result.merit && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-xs font-bold text-green-700 mb-1">救いポイント</p>
            <p className="text-sm text-green-800">{result.merit}</p>
          </div>
        )}
      </div>

      {/* この記事の使い方 */}
      {(() => {
        if (total >= 80) {
          return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 space-y-2">
              <p className="text-xs font-bold text-red-700">この記事の使い方</p>
              <p className="text-sm font-bold text-red-800">読む必要なし。時間の無駄。</p>
              {result.how_to_use && (
                <p className="text-sm text-red-900 leading-relaxed">{result.how_to_use}</p>
              )}
            </div>
          );
        }
        if (total >= 40) {
          return (
            <div className="space-y-3">
              <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-5 space-y-2">
                <p className="text-xs font-bold text-yellow-700">この記事の使い方</p>
                <p className="text-sm font-bold text-yellow-800">この部分だけ使え。</p>
                {result.how_to_use && (
                  <p className="text-sm text-yellow-900 leading-relaxed">{result.how_to_use}</p>
                )}
              </div>
              {(result.good_layer || result.kuso_layer) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-xs font-bold text-green-700 mb-2">本物の層</p>
                    <p className="text-sm text-green-900 leading-relaxed">
                      {result.good_layer ?? '価値のある部分は見当たらない'}
                    </p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-xs font-bold text-red-700 mb-2">クソの層</p>
                    <p className="text-sm text-red-900 leading-relaxed">
                      {result.kuso_layer ?? 'クソ要素は見当たらない'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        }
        return (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 space-y-2">
            <p className="text-xs font-bold text-green-700">この記事の使い方</p>
            <p className="text-sm font-bold text-green-800">そのまま読んでOK。</p>
            {result.how_to_use && (
              <p className="text-sm text-green-900 leading-relaxed">{result.how_to_use}</p>
            )}
          </div>
        );
      })()}

      {/* Evidence */}
      {result.evidence && result.evidence.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <EvidenceList evidence={result.evidence} />
        </div>
      )}

      {/* Price Warning */}
      {result.price_warning && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-5">
          <p className="text-xs font-bold text-yellow-700 mb-1">値段・購入に関する注意</p>
          <p className="text-sm text-yellow-900">{result.price_warning}</p>
        </div>
      )}

      {/* Download image */}
      <div className="pt-2">
        <DownloadImageButton
          total={total}
          displayScores={displayScores}
          verdict={verdict}
          result={result}
        />
      </div>

      {/* X Share */}
      {id && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => {
              const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://kuso-checker.vercel.app';
              const url = `${base}/result/${id}`;
              const text = `${verdict.verdict}（${total}点）\n${verdict.roast}\n\n#クソ記事チェッカー`;
              window.open(
                `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
                '_blank',
                'noopener,noreferrer'
              );
            }}
            className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white text-sm font-bold px-6 py-3 rounded-full transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.858L1.255 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Xでシェアする
          </button>
        </div>
      )}

    </div>
  );
}
