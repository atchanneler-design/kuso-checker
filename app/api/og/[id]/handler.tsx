import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { calcTotal, calcDisplayScores } from '@/lib/score';
import { getVerdict } from '@/lib/verdicts';

async function loadFont(text: string): Promise<ArrayBuffer | null> {
  const uniqText = Array.from(new Set(text.split(''))).sort().join('');
  const encoded = encodeURIComponent(uniqText);
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&text=${encoded}`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }
    ).then(r => r.text());
    const url = css.match(/src: url\(([^)]+)\)/)?.[1];
    if (!url) return null;
    return fetch(url).then(r => r.arrayBuffer());
  } catch {
    return null;
  }
}

function radarPt(cx: number, cy: number, r: number, i: number): string {
  const angle = (Math.PI * 2 * i / 5) - Math.PI / 2;
  return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
}

function gridPoly(cx: number, cy: number, r: number): string {
  return Array.from({ length: 5 }, (_, i) => radarPt(cx, cy, r, i)).join(' ');
}

function dataPoly(cx: number, cy: number, scores: number[], maxR: number): string {
  return scores.map((s, i) => radarPt(cx, cy, (s / 100) * maxR, i)).join(' ');
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

  let result: Record<string, unknown> | null = null;
  if (redisUrl && redisToken) {
    try {
      const res = await fetch(`${redisUrl}/get/result:${id}`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      });
      const json = await res.json() as { result?: string | null };
      if (json.result) {
        result = typeof json.result === 'string' ? JSON.parse(json.result) : json.result;
      }
    } catch { /* fall through */ }
  }

  if (!result) {
    return new Response('Not found', { status: 404 });
  }

  const scores = result as Parameters<typeof calcTotal>[0];
  const total = calcTotal(scores);
  const displayScores = calcDisplayScores(scores);
  const verdict = getVerdict(total);

  // Radar chart axes
  const axisLabels = ['有害度', '煽り誇大', '情報の薄さ', '囲い込み', '実績の怪しさ'] as const;
  const axisScores = axisLabels.map(k => displayScores[k]);

  // Load only the characters we actually render so the font subset is minimal
  const allText = [
    'クソ記事チェッカー',
    verdict.label,
    total.toString(),
    verdict.verdict,
    verdict.roast,
    'kuso-checker.vercel.app',
    ...axisLabels,
    ...axisScores.map(String),
  ].join('');

  const fontData = await loadFont(allText);
  const fonts = fontData
    ? [{ name: 'NotoSansJP', data: fontData, weight: 700 as const, style: 'normal' as const }]
    : [];
  const fontFamily = fontData ? 'NotoSansJP, sans-serif' : 'sans-serif';

  // ---- Radar chart geometry ----
  // SVG canvas: 700 × 630.  Center: (350, 315).
  const CX = 350;
  const CY = 315;
  const MAX_R = 185;   // pentagon radius
  const LABEL_R = 252; // label anchor radius (just outside MAX_R + safe gap)

  // Label box: 148px wide × ~62px tall (14px text + gap + 28px score + 12px v-pad)
  // Center box horizontally at lx, vertically at ly.
  const BOX_W = 148;
  const BOX_H = 62; // estimated: 6+14+4+28+6 (padding + label + gap + score + padding) + 4 line-height slack
  const BOX_HALF_W = BOX_W / 2;
  const BOX_HALF_H = BOX_H / 2;

  const labelPoints = axisLabels.map((label, i) => {
    const angle = (Math.PI * 2 * i / 5) - Math.PI / 2;
    const lx = CX + LABEL_R * Math.cos(angle);
    const ly = CY + LABEL_R * Math.sin(angle);
    return { label, score: axisScores[i], lx, ly };
  });

  const dotPoints = axisScores.map((s, i) => {
    const angle = (Math.PI * 2 * i / 5) - Math.PI / 2;
    const r = (s / 100) * MAX_R;
    return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) };
  });

  const axisLines = axisLabels.map((_, i) => {
    const angle = (Math.PI * 2 * i / 5) - Math.PI / 2;
    return { x: CX + MAX_R * Math.cos(angle), y: CY + MAX_R * Math.sin(angle) };
  });

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '1200px',
          height: '630px',
          background: '#0a0a0a',
          fontFamily,
        }}
      >
        {/* ── Left panel ─────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '500px',
            padding: '44px 32px 36px 52px',
          }}
        >
          {/* Site name – all text needs fontWeight:700 so Satori uses the loaded font */}
          <span style={{ display: 'flex', fontSize: 15, fontWeight: 700, color: '#d4d4d4', marginBottom: '18px', letterSpacing: '0.12em' }}>
            クソ記事チェッカー
          </span>

          {/* Danger badge */}
          <div
            style={{
              display: 'flex',
              alignSelf: 'flex-start',
              background: verdict.color,
              color: '#ffffff',
              fontSize: 22,
              fontWeight: 700,
              padding: '8px 24px',
              borderRadius: '30px',
              marginBottom: '14px',
            }}
          >
            {verdict.label}
          </div>

          {/* Score */}
          <span
            style={{
              display: 'flex',
              fontSize: 180,
              fontWeight: 700,
              color: verdict.color,
              lineHeight: '0.88',
              letterSpacing: '-0.05em',
            }}
          >
            {total}
          </span>

          {/* Verdict */}
          <span
            style={{
              display: 'flex',
              fontSize: 40,
              fontWeight: 700,
              color: '#ffffff',
              marginTop: '14px',
              lineHeight: '1.2',
            }}
          >
            {verdict.verdict}
          </span>

          {/* Roast – keep at 21px so long strings don't overflow vertically */}
          <span
            style={{
              display: 'flex',
              fontSize: 21,
              fontWeight: 700,
              color: '#e8e8e8',
              marginTop: '16px',
              lineHeight: '1.65',
            }}
          >
            {verdict.roast}
          </span>

          <div style={{ display: 'flex', flex: 1 }} />

          {/* Footer URL */}
          <span style={{ display: 'flex', fontSize: 14, fontWeight: 700, color: '#888888' }}>
            kuso-checker.vercel.app
          </span>
        </div>

        {/* Thin vertical divider */}
        <div style={{ display: 'flex', width: '1px', background: '#1c1c1c', margin: '44px 0' }} />

        {/* ── Right panel – radar chart ───────────────────────────── */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/*
            The SVG is 700×630, matching the available right-area width.
            Satori crashes when <text> is inside <svg>, so labels live in
            an absolutely-positioned <div> overlay instead.
          */}
          <div style={{ position: 'relative', display: 'flex', width: '699px', height: '630px' }}>
            <svg width="699" height="630" xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', top: 0, left: 0 }}>
              {/* Grid pentagons */}
              <polygon points={gridPoly(CX, CY, MAX_R)}        fill="none" stroke="#2e2e2e" strokeWidth="1.5" />
              <polygon points={gridPoly(CX, CY, MAX_R * 0.66)} fill="none" stroke="#222222" strokeWidth="1" />
              <polygon points={gridPoly(CX, CY, MAX_R * 0.33)} fill="none" stroke="#1a1a1a" strokeWidth="1" />

              {/* Axis lines */}
              <line x1={CX} y1={CY} x2={axisLines[0].x} y2={axisLines[0].y} stroke="#252525" strokeWidth="1" />
              <line x1={CX} y1={CY} x2={axisLines[1].x} y2={axisLines[1].y} stroke="#252525" strokeWidth="1" />
              <line x1={CX} y1={CY} x2={axisLines[2].x} y2={axisLines[2].y} stroke="#252525" strokeWidth="1" />
              <line x1={CX} y1={CY} x2={axisLines[3].x} y2={axisLines[3].y} stroke="#252525" strokeWidth="1" />
              <line x1={CX} y1={CY} x2={axisLines[4].x} y2={axisLines[4].y} stroke="#252525" strokeWidth="1" />

              {/* Data fill polygon */}
              <polygon
                points={dataPoly(CX, CY, axisScores, MAX_R)}
                fill={verdict.color}
                fillOpacity="0.30"
                stroke={verdict.color}
                strokeWidth="2.5"
                strokeLinejoin="round"
              />

              {/* Vertex dots */}
              <circle cx={dotPoints[0].x} cy={dotPoints[0].y} r="6" fill={verdict.color} />
              <circle cx={dotPoints[1].x} cy={dotPoints[1].y} r="6" fill={verdict.color} />
              <circle cx={dotPoints[2].x} cy={dotPoints[2].y} r="6" fill={verdict.color} />
              <circle cx={dotPoints[3].x} cy={dotPoints[3].y} r="6" fill={verdict.color} />
              <circle cx={dotPoints[4].x} cy={dotPoints[4].y} r="6" fill={verdict.color} />
            </svg>

            {/*
              Label overlay.
              Each label box is BOX_W × BOX_H, centered at (lx, ly).
              A solid dark background prevents the pentagon lines from
              visually bleeding into the text.
              All text elements carry fontWeight:700 so Satori picks
              the loaded NotoSansJP rather than a system fallback.
            */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex' }}>
              {labelPoints.map((pt, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: pt.lx - BOX_HALF_W,
                    top: pt.ly - BOX_HALF_H,
                    width: `${BOX_W}px`,
                    height: `${BOX_H}px`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#111111',
                    borderRadius: '8px',
                    padding: '0 6px',
                  }}
                >
                  <div style={{ display: 'flex', color: '#cccccc', fontSize: 14, fontWeight: 700, lineHeight: '1', marginBottom: '5px' }}>
                    {pt.label}
                  </div>
                  <div style={{ display: 'flex', color: verdict.color, fontSize: 28, fontWeight: 700, lineHeight: '1' }}>
                    {pt.score}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts }
  );
}
