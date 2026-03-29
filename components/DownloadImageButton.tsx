'use client';

import { useState, useEffect, useCallback } from 'react';
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

/** Character-by-character wrap for CJK text */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const char of text) {
    const test = line + char;
    if (ctx.measureText(test).width > maxWidth && line.length > 0) {
      lines.push(line);
      line = char;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
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

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
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

function drawRadar(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, maxR: number,
  scores: number[],
  labels: string[],
  color: string,
) {
  const N = 5;
  const angles = Array.from({ length: N }, (_, i) => (Math.PI * 2 * i / N) - Math.PI / 2);
  const [cr, cg, cb] = hexToRgb(color);

  // Grid pentagons
  for (const [ratio, stroke] of [[1, '#333'], [0.66, '#252525'], [0.33, '#1e1e1e']] as [number, string][]) {
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
    const r = (scores[i] / 100) * maxR;
    const px = cx + r * Math.cos(a);
    const py = cy + r * Math.sin(a);
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  });
  ctx.closePath();
  ctx.fillStyle = `rgba(${cr},${cg},${cb},0.22)`;
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Dots
  angles.forEach((a, i) => {
    const r = (scores[i] / 100) * maxR;
    ctx.beginPath();
    ctx.arc(cx + r * Math.cos(a), cy + r * Math.sin(a), 5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  });

  // Labels (axis name + score value)
  const labelR = maxR + 48;
  ctx.textBaseline = 'middle';
  angles.forEach((a, i) => {
    const lx = cx + labelR * Math.cos(a);
    const ly = cy + labelR * Math.sin(a);
    const align: CanvasTextAlign = Math.abs(lx - cx) < 20 ? 'center' : lx < cx ? 'right' : 'left';
    ctx.textAlign = align;
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#666';
    ctx.fillText(labels[i], lx, ly - 16);
    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = color;
    ctx.fillText(String(scores[i]), lx, ly + 10);
  });
}

// ---- Render all sections, returns final Y ----

function renderAll(
  ctx: CanvasRenderingContext2D,
  W: number,
  PAD: number,
  IW: number,
  total: number,
  displayScores: DisplayScores,
  verdict: Verdict,
  result: ApiResult,
): number {
  // Background (fill oversized)
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, W, 9000);

  let y = 0;

  // ---- 1. HEADER ----
  const HEADER_H = 240;
  ctx.fillStyle = verdict.color;
  ctx.fillRect(0, 0, W, HEADER_H);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '17px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText('クソ記事チェッカー', W / 2, 42);

  // Badge pill
  ctx.font = 'bold 20px sans-serif';
  const bw = ctx.measureText(verdict.label).width + 44;
  const bh = 36;
  const bx = (W - bw) / 2;
  const by = 70;
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  drawRoundedRect(ctx, bx, by, bw, bh, 18);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.fillText(verdict.label, W / 2, by + 18);

  y = HEADER_H + 50;

  // ---- 2. SCORE ----
  ctx.font = 'bold 180px sans-serif';
  ctx.fillStyle = verdict.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(String(total), W / 2, y);
  y += 180 + 8;

  ctx.font = 'bold 40px sans-serif';
  ctx.fillStyle = '#fff';
  ctx.fillText(verdict.verdict, W / 2, y);
  y += 40 + 12;

  ctx.font = 'italic 22px sans-serif';
  ctx.fillStyle = '#888';
  wrapText(ctx, verdict.roast, IW).forEach(line => {
    ctx.fillText(line, W / 2, y);
    y += 36;
  });
  y += 22;

  drawDivider(ctx, PAD, y, IW);
  y += 40;

  // ---- 3. RADAR CHART ----
  const RADAR_R = 168;
  const radarCY = y + RADAR_R + 46;
  const axisLabels = ['有害度', '煽り誇大', '情報の薄さ', '囲い込み', '実績の怪しさ'];
  const axisScores = [
    displayScores['有害度'],
    displayScores['煽り誇大'],
    displayScores['情報の薄さ'],
    displayScores['囲い込み'],
    displayScores['実績の怪しさ'],
  ];
  drawRadar(ctx, W / 2, radarCY, RADAR_R, axisScores, axisLabels, verdict.color);
  y = radarCY + RADAR_R + 72;

  drawDivider(ctx, PAD, y, IW);
  y += 40;

  // ---- Helper: section title + body text ----
  const TITLE_FS = 13;
  const BODY_FS = 20;
  const BODY_LH = 33;

  function drawSection(title: string, text: string, textColor = '#ccc') {
    ctx.font = `bold ${TITLE_FS}px sans-serif`;
    ctx.fillStyle = '#555';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(title, PAD, y);
    y += TITLE_FS + 12;

    ctx.font = `${BODY_FS}px sans-serif`;
    ctx.fillStyle = textColor;
    wrapText(ctx, text, IW).forEach(line => {
      ctx.fillText(line, PAD, y);
      y += BODY_LH;
    });
    y += 14;
  }

  // ---- 4. COMMENT ----
  drawSection('総評', result.comment);

  // ---- 5. LAYERS ----
  if (result.good_layer || result.kuso_layer) {
    drawDivider(ctx, PAD, y, IW);
    y += 36;

    const GAP = 16;
    const BOX_W = (IW - GAP) / 2;
    const BOX_PAD = 18;
    const CONTENT_W = BOX_W - BOX_PAD * 2;
    const BOX_TITLE_FS = 12;
    const BOX_BODY_FS = 18;
    const BOX_LH = 30;

    const goodText = result.good_layer ?? '価値のある部分は見当たらない';
    const kusoText = result.kuso_layer ?? 'クソ要素は見当たらない';

    function measureBox(text: string): number {
      ctx.font = `${BOX_BODY_FS}px sans-serif`;
      return BOX_PAD * 2 + BOX_TITLE_FS + 10 + wrapText(ctx, text, CONTENT_W).length * BOX_LH;
    }

    const boxH = Math.max(measureBox(goodText), measureBox(kusoText));

    // Good layer
    ctx.fillStyle = 'rgba(29,158,117,0.1)';
    drawRoundedRect(ctx, PAD, y, BOX_W, boxH, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(29,158,117,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = `bold ${BOX_TITLE_FS}px sans-serif`;
    ctx.fillStyle = '#1D9E75';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('本物の層', PAD + BOX_PAD, y + BOX_PAD);

    ctx.font = `${BOX_BODY_FS}px sans-serif`;
    ctx.fillStyle = '#aaa';
    let gy = y + BOX_PAD + BOX_TITLE_FS + 10;
    wrapText(ctx, goodText, CONTENT_W).forEach(line => {
      ctx.fillText(line, PAD + BOX_PAD, gy);
      gy += BOX_LH;
    });

    // Kuso layer
    const kx = PAD + BOX_W + GAP;
    ctx.fillStyle = 'rgba(226,75,74,0.1)';
    drawRoundedRect(ctx, kx, y, BOX_W, boxH, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(226,75,74,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = `bold ${BOX_TITLE_FS}px sans-serif`;
    ctx.fillStyle = '#E24B4A';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('クソの層', kx + BOX_PAD, y + BOX_PAD);

    ctx.font = `${BOX_BODY_FS}px sans-serif`;
    ctx.fillStyle = '#aaa';
    let ky = y + BOX_PAD + BOX_TITLE_FS + 10;
    wrapText(ctx, kusoText, CONTENT_W).forEach(line => {
      ctx.fillText(line, kx + BOX_PAD, ky);
      ky += BOX_LH;
    });

    y += boxH + 14;
  }

  // ---- 6. HOW TO USE ----
  if (result.how_to_use) {
    drawDivider(ctx, PAD, y, IW);
    y += 36;
    drawSection('この記事の使い方', result.how_to_use);
  }

  // ---- 7. EVIDENCE ----
  if (result.evidence.length > 0) {
    drawDivider(ctx, PAD, y, IW);
    y += 36;

    ctx.font = `bold ${TITLE_FS}px sans-serif`;
    ctx.fillStyle = '#555';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('検出フレーズ・構造的問題', PAD, y);
    y += TITLE_FS + 12;

    const EV_FS = 18;
    const EV_LH = 30;
    const ICON_W = 26;

    result.evidence.forEach(item => {
      ctx.font = `${EV_FS}px sans-serif`;
      const lines = wrapText(ctx, item, IW - ICON_W);
      lines.forEach((line, li) => {
        if (li === 0) {
          ctx.fillStyle = '#EF9F27';
          ctx.fillText('⚠', PAD, y);
          ctx.fillStyle = '#aaa';
          ctx.fillText(line, PAD + ICON_W, y);
        } else {
          ctx.fillStyle = '#aaa';
          ctx.fillText(line, PAD + ICON_W, y);
        }
        y += EV_LH;
      });
      y += 6;
    });
    y += 8;
  }

  // ---- 8. PRICE WARNING ----
  if (result.price_warning) {
    drawDivider(ctx, PAD, y, IW);
    y += 36;

    const PW_FS = 18;
    const PW_LH = 30;
    const PW_BOX_PAD = 20;

    ctx.font = `${PW_FS}px sans-serif`;
    const pwLines = wrapText(ctx, result.price_warning, IW - PW_BOX_PAD * 2);
    const pwBoxH = PW_BOX_PAD * 2 + TITLE_FS + 10 + pwLines.length * PW_LH;

    ctx.fillStyle = 'rgba(239,159,39,0.1)';
    drawRoundedRect(ctx, PAD, y, IW, pwBoxH, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(239,159,39,0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = `bold ${TITLE_FS}px sans-serif`;
    ctx.fillStyle = '#EF9F27';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('値段・購入に関する注意', PAD + PW_BOX_PAD, y + PW_BOX_PAD);

    ctx.font = `${PW_FS}px sans-serif`;
    ctx.fillStyle = '#c8900a';
    let pwy = y + PW_BOX_PAD + TITLE_FS + 10;
    pwLines.forEach(line => {
      ctx.fillText(line, PAD + PW_BOX_PAD, pwy);
      pwy += PW_LH;
    });

    y += pwBoxH + 14;
  }

  // ---- 9. FOOTER ----
  drawDivider(ctx, PAD, y, IW);
  y += 28;
  ctx.font = '16px sans-serif';
  ctx.fillStyle = '#444';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('kuso-checker.vercel.app', W / 2, y);
  y += 16 + 44;

  return y;
}

// ---- Generate final canvas (1080×1920 fixed width, auto height) ----

function generateCanvas(
  total: number,
  displayScores: DisplayScores,
  verdict: Verdict,
  result: ApiResult,
): HTMLCanvasElement {
  const W = 1080;
  const MIN_H = 1920;
  const PAD = 60;
  const IW = W - PAD * 2;

  // Pass 1: measure height
  const measureCanvas = document.createElement('canvas');
  measureCanvas.width = W;
  measureCanvas.height = 100;
  const contentH = renderAll(measureCanvas.getContext('2d')!, W, PAD, IW, total, displayScores, verdict, result);

  const H = Math.max(MIN_H, contentH);

  // Pass 2: draw on properly-sized canvas
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  renderAll(canvas.getContext('2d')!, W, PAD, IW, total, displayScores, verdict, result);

  return canvas;
}

// ---- Component ----

export default function DownloadImageButton({ total, displayScores, verdict, result }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const generate = useCallback(() => {
    setGenerating(true);
    setPreviewUrl(null);
    setTimeout(() => {
      try {
        const canvas = generateCanvas(total, displayScores, verdict, result);
        setPreviewUrl(canvas.toDataURL('image/png'));
      } finally {
        setGenerating(false);
      }
    }, 20);
  }, [total, displayScores, verdict, result]);

  useEffect(() => {
    if (!modalOpen) {
      setPreviewUrl(null);
      return;
    }
    generate();
  }, [modalOpen, generate]);

  const handleDownload = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = 'kuso-checker-1080x1920.png';
    a.click();
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setModalOpen(true)}
        className="flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-bold px-6 py-3 rounded-full transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        結果画像をダウンロード
      </button>

      {/* Modal overlay */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-[#111] rounded-2xl overflow-hidden w-full max-w-[400px] flex flex-col"
            style={{ maxHeight: '90vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0">
              <span className="text-white font-bold text-sm">結果画像</span>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-500 hover:text-gray-300 transition-colors"
                aria-label="閉じる"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Preview (scrollable) */}
            <div className="flex-1 overflow-y-auto px-5 pb-4 min-h-0">
              <div className="bg-black rounded-xl overflow-hidden">
                {generating ? (
                  <div className="flex items-center justify-center h-48 text-gray-500 text-sm gap-2">
                    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    生成中…
                  </div>
                ) : previewUrl ? (
                  <img src={previewUrl} alt="プレビュー" className="w-full h-auto block" />
                ) : null}
              </div>
            </div>

            {/* Tip + Download button */}
            <div className="px-5 pt-3 pb-5 border-t border-[#1e1e1e] flex-shrink-0 space-y-3">
              <p className="text-xs text-gray-500 text-center leading-relaxed">
                💡 スマホの場合は画像を長押しして「写真に保存」または「コピー」できます
              </p>
              <button
                onClick={handleDownload}
                disabled={!previewUrl || generating}
                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-200 disabled:opacity-40 text-gray-900 text-sm font-bold py-3 rounded-full transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                ダウンロード
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
