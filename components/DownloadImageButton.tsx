'use client';

import { useState } from 'react';
import { type DisplayScores } from '@/lib/score';
import { type Verdict } from '@/lib/verdicts';

type ApiResult = {
  comment: string;
  merit: string | null;
  evidence: string[];
  price_warning: string | null;
  good_layer: string | null;
  kuso_layer: string | null;
  how_to_use: string | null;
};

type Format = 'story' | 'square';

type Props = {
  total: number;
  displayScores: DisplayScores;
  verdict: Verdict;
  result: ApiResult;
};

// ---- Canvas helpers ----

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Character-by-character text wrap for CJK text */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines?: number,
): string[] {
  const lines: string[] = [];
  let line = '';
  for (const char of text) {
    const test = line + char;
    if (ctx.measureText(test).width > maxWidth && line.length > 0) {
      lines.push(line);
      if (maxLines && lines.length >= maxLines) return lines;
      line = char;
    } else {
      line = test;
    }
  }
  if (line && (!maxLines || lines.length < maxLines)) lines.push(line);
  return lines;
}

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawDivider(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  ctx.save();
  ctx.strokeStyle = '#1e1e1e';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.stroke();
  ctx.restore();
}

function drawRadar(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, maxR: number,
  scores: number[],
  labels: string[],
  color: string,
  labelFontSize: number,
) {
  const N = 5;
  const angles = Array.from({ length: N }, (_, i) => (Math.PI * 2 * i / N) - Math.PI / 2);
  const [cr, cg, cb] = hexToRgb(color);

  ctx.save();

  // Grid pentagons
  for (const [ratio, stroke] of ([[1, '#333'], [0.66, '#252525'], [0.33, '#1e1e1e']] as [number, string][])) {
    ctx.beginPath();
    angles.forEach((a, i) => {
      const px = cx + maxR * ratio * Math.cos(a);
      const py = cy + maxR * ratio * Math.sin(a);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = ratio === 1 ? 1.5 : 1;
    ctx.stroke();
  }

  // Axis lines
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 1;
  angles.forEach(a => {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + maxR * Math.cos(a), cy + maxR * Math.sin(a));
    ctx.stroke();
  });

  // Data polygon
  ctx.beginPath();
  angles.forEach((a, i) => {
    const rr = (scores[i] / 100) * maxR;
    const px = cx + rr * Math.cos(a);
    const py = cy + rr * Math.sin(a);
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  });
  ctx.closePath();
  ctx.fillStyle = `rgba(${cr},${cg},${cb},0.22)`;
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Vertex dots
  angles.forEach((a, i) => {
    const rr = (scores[i] / 100) * maxR;
    ctx.beginPath();
    ctx.arc(cx + rr * Math.cos(a), cy + rr * Math.sin(a), 5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  });

  // Labels
  const labelR = maxR + Math.round(labelFontSize * 2.8);
  ctx.textBaseline = 'middle';
  angles.forEach((a, i) => {
    const lx = cx + labelR * Math.cos(a);
    const ly = cy + labelR * Math.sin(a);
    const align: CanvasTextAlign = Math.abs(lx - cx) < 20 ? 'center' : lx < cx ? 'right' : 'left';
    ctx.textAlign = align;
    ctx.font = `${labelFontSize}px sans-serif`;
    ctx.fillStyle = '#666';
    ctx.fillText(labels[i], lx, ly - labelFontSize);
    ctx.font = `bold ${Math.round(labelFontSize * 1.55)}px sans-serif`;
    ctx.fillStyle = color;
    ctx.fillText(String(scores[i]), lx, ly + Math.round(labelFontSize * 0.7));
  });

  ctx.restore();
}

// ---- Main draw function ----

async function generateCanvas(
  format: Format,
  total: number,
  displayScores: DisplayScores,
  verdict: Verdict,
  result: ApiResult,
): Promise<HTMLCanvasElement> {
  const isStory = format === 'story';
  const W = isStory ? 1080 : 1200;
  const H = isStory ? 1920 : 1200;
  // Scale factor: story uses full size, square is more compact
  const S = isStory ? 1.0 : 0.78;

  const PAD = Math.round(60 * S);
  const IW = W - PAD * 2;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, W, H);

  let y = 0;

  // ---- HEADER ----
  const headerH = Math.round(230 * S);
  ctx.fillStyle = verdict.color;
  ctx.fillRect(0, 0, W, headerH);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.round(17 * S)}px sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText('クソ記事チェッカー', W / 2, Math.round(42 * S));

  // Badge pill
  const badgeFS = Math.round(20 * S);
  ctx.font = `bold ${badgeFS}px sans-serif`;
  const bw = ctx.measureText(verdict.label).width + Math.round(44 * S);
  const bh = Math.round(36 * S);
  const bx = (W - bw) / 2;
  const by = Math.round(68 * S);
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  drawRoundRect(ctx, bx, by, bw, bh, bh / 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.fillText(verdict.label, W / 2, by + bh / 2);

  y = headerH + Math.round(42 * S);

  // ---- SCORE ----
  const scoreFS = Math.round(190 * S);
  ctx.font = `bold ${scoreFS}px sans-serif`;
  ctx.fillStyle = verdict.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(String(total), W / 2, y);
  y += scoreFS + Math.round(6 * S);

  const verdictFS = Math.round(40 * S);
  ctx.font = `bold ${verdictFS}px sans-serif`;
  ctx.fillStyle = '#fff';
  ctx.fillText(verdict.verdict, W / 2, y);
  y += verdictFS + Math.round(12 * S);

  const roastFS = Math.round(21 * S);
  ctx.font = `italic ${roastFS}px sans-serif`;
  ctx.fillStyle = '#888';
  const roastLines = wrapText(ctx, verdict.roast, IW, 2);
  roastLines.forEach(line => {
    ctx.fillText(line, W / 2, y);
    y += Math.round(roastFS * 1.65);
  });
  y += Math.round(16 * S);

  drawDivider(ctx, PAD, y, IW);
  y += Math.round(36 * S);

  // ---- RADAR CHART ----
  const radarR = Math.round(165 * S);
  const radarCY = y + radarR + Math.round(46 * S);

  const axisLabels = ['有害度', '煽り誇大', '情報の薄さ', '囲い込み', '実績の怪しさ'];
  const axisScores = [
    displayScores['有害度'],
    displayScores['煽り誇大'],
    displayScores['情報の薄さ'],
    displayScores['囲い込み'],
    displayScores['実績の怪しさ'],
  ];

  drawRadar(ctx, W / 2, radarCY, radarR, axisScores, axisLabels, verdict.color, Math.round(15 * S));
  y = radarCY + radarR + Math.round(65 * S);

  drawDivider(ctx, PAD, y, IW);
  y += Math.round(36 * S);

  // ---- COMMENT ----
  const titleFS = Math.round(13 * S);
  const bodyFS = Math.round(20 * S);
  const bodyLH = Math.round(bodyFS * 1.65);

  ctx.font = `bold ${titleFS}px sans-serif`;
  ctx.fillStyle = '#555';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('総評', PAD, y);
  y += titleFS + Math.round(12 * S);

  ctx.font = `${bodyFS}px sans-serif`;
  ctx.fillStyle = '#ccc';
  const commentLines = wrapText(ctx, result.comment, IW, isStory ? 6 : 3);
  commentLines.forEach(line => {
    ctx.fillText(line, PAD, y);
    y += bodyLH;
  });
  y += Math.round(14 * S);

  // ---- HOW TO USE (story only) ----
  if (result.how_to_use && isStory) {
    drawDivider(ctx, PAD, y, IW);
    y += Math.round(36 * S);

    ctx.font = `bold ${titleFS}px sans-serif`;
    ctx.fillStyle = '#555';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('この記事の使い方', PAD, y);
    y += titleFS + Math.round(12 * S);

    ctx.font = `${bodyFS}px sans-serif`;
    ctx.fillStyle = '#ccc';
    const howLines = wrapText(ctx, result.how_to_use, IW, 4);
    howLines.forEach(line => {
      ctx.fillText(line, PAD, y);
      y += bodyLH;
    });
    y += Math.round(14 * S);
  }

  // ---- EVIDENCE (story only) ----
  const evidenceItems = result.evidence.slice(0, 3);
  if (evidenceItems.length > 0 && isStory) {
    drawDivider(ctx, PAD, y, IW);
    y += Math.round(36 * S);

    ctx.font = `bold ${titleFS}px sans-serif`;
    ctx.fillStyle = '#555';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('検出フレーズ', PAD, y);
    y += titleFS + Math.round(12 * S);

    const evidFS = Math.round(17 * S);
    const evidLH = Math.round(evidFS * 1.7);
    evidenceItems.forEach(item => {
      ctx.font = `${evidFS}px sans-serif`;
      ctx.fillStyle = '#aaa';
      const lines = wrapText(ctx, `• ${item}`, IW, 2);
      lines.forEach(line => {
        ctx.fillText(line, PAD, y);
        y += evidLH;
      });
      y += Math.round(5 * S);
    });
  }

  // ---- FOOTER (anchored to bottom) ----
  const footerY = H - Math.round(52 * S);
  drawDivider(ctx, PAD, footerY - 10, IW);
  ctx.font = `${Math.round(16 * S)}px sans-serif`;
  ctx.fillStyle = '#444';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('kuso-checker.vercel.app', W / 2, footerY + 20);

  return canvas;
}

// ---- Component ----

export default function DownloadImageButton({ total, displayScores, verdict, result }: Props) {
  const [format, setFormat] = useState<Format>('story');
  const [generating, setGenerating] = useState(false);

  const handleDownload = async () => {
    setGenerating(true);
    try {
      const canvas = await generateCanvas(format, total, displayScores, verdict, result);
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `kuso-checker-${format === 'story' ? '1080x1920' : '1200x1200'}.png`;
      a.click();
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Format selector */}
      <div className="flex rounded-full bg-gray-100 p-1 text-sm">
        <button
          onClick={() => setFormat('story')}
          className={`px-4 py-1.5 rounded-full font-medium transition-colors ${
            format === 'story'
              ? 'bg-white shadow text-gray-900'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          ストーリー 1080×1920
        </button>
        <button
          onClick={() => setFormat('square')}
          className={`px-4 py-1.5 rounded-full font-medium transition-colors ${
            format === 'square'
              ? 'bg-white shadow text-gray-900'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          正方形 1200×1200
        </button>
      </div>

      {/* Download button */}
      <button
        onClick={handleDownload}
        disabled={generating}
        className="flex items-center gap-2 bg-gray-900 hover:bg-gray-700 disabled:opacity-50 text-white text-sm font-bold px-6 py-3 rounded-full transition-colors"
      >
        {generating ? (
          <>
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            生成中…
          </>
        ) : (
          <>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            結果画像をダウンロード
          </>
        )}
      </button>
    </div>
  );
}
