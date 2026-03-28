'use client';

import { useEffect, useState } from 'react';

type Props = {
  score: number;
};

function getColor(score: number): string {
  if (score >= 80) return '#E24B4A';
  if (score >= 60) return '#E24B4A';
  if (score >= 40) return '#EF9F27';
  if (score >= 20) return '#5DCAA5';
  return '#1D9E75';
}

function getLabel(score: number): string {
  if (score >= 80) return '極めて危険';
  if (score >= 60) return '危険';
  if (score >= 40) return 'やや怪しい';
  if (score >= 20) return '概ね安全';
  return '安全';
}

export default function ScoreMeter({ score }: Props) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    setDisplayScore(0);
    const duration = 1000;
    const steps = 60;
    const increment = score / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(Math.round(increment * step), score);
      setDisplayScore(current);
      if (step >= steps) clearInterval(timer);
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score]);

  const color = getColor(score);
  const label = getLabel(score);

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-600">クソ度スコア</span>
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: color }}
          >
            {label}
          </span>
          <span className="text-lg font-bold" style={{ color }}>
            {displayScore}
          </span>
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
        <div
          className="h-4 rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${displayScore}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>0</span>
        <span>25</span>
        <span>50</span>
        <span>75</span>
        <span>100</span>
      </div>
    </div>
  );
}
