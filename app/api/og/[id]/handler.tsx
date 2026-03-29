import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { calcTotal, calcDisplayScores } from '@/lib/score';
import { getVerdict } from '@/lib/verdicts';

async function loadFont(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700',
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

  const fontData = await loadFont();
  const fonts = fontData
    ? [{ name: 'NotoSansJP', data: fontData, weight: 700 as const, style: 'normal' as const }]
    : [];
  const fontFamily = fontData ? 'NotoSansJP, sans-serif' : 'sans-serif';

  // Radar chart
  const axisLabels = ['有害度', '煽り誇大', '情報の薄さ', '囲い込み', '実績の怪しさ'] as const;
  const axisScores = axisLabels.map(k => displayScores[k]);

  const CX = 310;
  const CY = 265;
  const MAX_R = 185;
  const LABEL_R = 228;

  // Pre-compute label positions for rendering
  const labelPoints = axisLabels.map((label, i) => {
    const angle = (Math.PI * 2 * i / 5) - Math.PI / 2;
    const lx = CX + LABEL_R * Math.cos(angle);
    const ly = CY + LABEL_R * Math.sin(angle);
    const anchor = lx < CX - 20 ? 'end' : lx > CX + 20 ? 'start' : 'middle';
    return { label, score: axisScores[i], lx, ly, anchor };
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
        {/* Left area – 500px */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '500px',
            padding: '44px 36px 36px 52px',
          }}
        >
          <span style={{ fontSize: 13, color: '#555', marginBottom: '18px', letterSpacing: '0.08em' }}>
            クソ記事チェッカー
          </span>

          <div
            style={{
              display: 'flex',
              alignSelf: 'flex-start',
              background: verdict.color,
              color: 'white',
              fontSize: 17,
              fontWeight: 700,
              padding: '5px 18px',
              borderRadius: '24px',
              marginBottom: '10px',
            }}
          >
            {verdict.label}
          </div>

          <span
            style={{
              fontSize: 180,
              fontWeight: 700,
              color: verdict.color,
              lineHeight: '1',
              letterSpacing: '-0.05em',
            }}
          >
            {total}
          </span>

          <span
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: 'white',
              marginTop: '6px',
              lineHeight: '1.2',
            }}
          >
            {verdict.verdict}
          </span>

          <span
            style={{
              fontSize: 20,
              color: '#888',
              marginTop: '14px',
              lineHeight: '1.65',
              fontStyle: 'italic',
            }}
          >
            {verdict.roast}
          </span>

          <div style={{ flex: 1 }} />

          <span style={{ fontSize: 13, color: '#444' }}>
            kuso-checker.vercel.app
          </span>
        </div>

        {/* Divider */}
        <div style={{ width: '1px', background: '#1c1c1c', margin: '44px 0' }} />

        {/* Right area – radar chart */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="620" height="530" xmlns="http://www.w3.org/2000/svg">
            {/* Grid pentagons */}
            <polygon points={gridPoly(CX, CY, MAX_R)} fill="none" stroke="#222" strokeWidth="1.5" />
            <polygon points={gridPoly(CX, CY, MAX_R * 0.66)} fill="none" stroke="#1e1e1e" strokeWidth="1" />
            <polygon points={gridPoly(CX, CY, MAX_R * 0.33)} fill="none" stroke="#1a1a1a" strokeWidth="1" />

            {/* Axis lines */}
            <line x1={CX} y1={CY} x2={axisLines[0].x} y2={axisLines[0].y} stroke="#222" strokeWidth="1" />
            <line x1={CX} y1={CY} x2={axisLines[1].x} y2={axisLines[1].y} stroke="#222" strokeWidth="1" />
            <line x1={CX} y1={CY} x2={axisLines[2].x} y2={axisLines[2].y} stroke="#222" strokeWidth="1" />
            <line x1={CX} y1={CY} x2={axisLines[3].x} y2={axisLines[3].y} stroke="#222" strokeWidth="1" />
            <line x1={CX} y1={CY} x2={axisLines[4].x} y2={axisLines[4].y} stroke="#222" strokeWidth="1" />

            {/* Data fill */}
            <polygon
              points={dataPoly(CX, CY, axisScores, MAX_R)}
              fill={verdict.color}
              fillOpacity="0.22"
              stroke={verdict.color}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />

            {/* Vertex dots */}
            <circle cx={dotPoints[0].x} cy={dotPoints[0].y} r="5.5" fill={verdict.color} />
            <circle cx={dotPoints[1].x} cy={dotPoints[1].y} r="5.5" fill={verdict.color} />
            <circle cx={dotPoints[2].x} cy={dotPoints[2].y} r="5.5" fill={verdict.color} />
            <circle cx={dotPoints[3].x} cy={dotPoints[3].y} r="5.5" fill={verdict.color} />
            <circle cx={dotPoints[4].x} cy={dotPoints[4].y} r="5.5" fill={verdict.color} />

            {/* Labels */}
            <text x={labelPoints[0].lx} y={labelPoints[0].ly - 7} textAnchor={labelPoints[0].anchor} fill="#888" fontSize="14" fontFamily={fontFamily}>{labelPoints[0].label}</text>
            <text x={labelPoints[0].lx} y={labelPoints[0].ly + 18} textAnchor={labelPoints[0].anchor} fill={verdict.color} fontSize="22" fontWeight="700" fontFamily={fontFamily}>{labelPoints[0].score}</text>

            <text x={labelPoints[1].lx} y={labelPoints[1].ly - 7} textAnchor={labelPoints[1].anchor} fill="#888" fontSize="14" fontFamily={fontFamily}>{labelPoints[1].label}</text>
            <text x={labelPoints[1].lx} y={labelPoints[1].ly + 18} textAnchor={labelPoints[1].anchor} fill={verdict.color} fontSize="22" fontWeight="700" fontFamily={fontFamily}>{labelPoints[1].score}</text>

            <text x={labelPoints[2].lx} y={labelPoints[2].ly - 7} textAnchor={labelPoints[2].anchor} fill="#888" fontSize="14" fontFamily={fontFamily}>{labelPoints[2].label}</text>
            <text x={labelPoints[2].lx} y={labelPoints[2].ly + 18} textAnchor={labelPoints[2].anchor} fill={verdict.color} fontSize="22" fontWeight="700" fontFamily={fontFamily}>{labelPoints[2].score}</text>

            <text x={labelPoints[3].lx} y={labelPoints[3].ly - 7} textAnchor={labelPoints[3].anchor} fill="#888" fontSize="14" fontFamily={fontFamily}>{labelPoints[3].label}</text>
            <text x={labelPoints[3].lx} y={labelPoints[3].ly + 18} textAnchor={labelPoints[3].anchor} fill={verdict.color} fontSize="22" fontWeight="700" fontFamily={fontFamily}>{labelPoints[3].score}</text>

            <text x={labelPoints[4].lx} y={labelPoints[4].ly - 7} textAnchor={labelPoints[4].anchor} fill="#888" fontSize="14" fontFamily={fontFamily}>{labelPoints[4].label}</text>
            <text x={labelPoints[4].lx} y={labelPoints[4].ly + 18} textAnchor={labelPoints[4].anchor} fill={verdict.color} fontSize="22" fontWeight="700" fontFamily={fontFamily}>{labelPoints[4].score}</text>
          </svg>
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts }
  );
}
