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
  const comment = String(result.comment ?? '');
  const bars = Object.entries(displayScores) as [string, number][];
  const BAR_MAX = 280;

  const fontData = await loadFont();
  const fonts = fontData
    ? [{ name: 'NotoSansJP', data: fontData, weight: 700 as const, style: 'normal' as const }]
    : [];
  const fontFamily = fontData ? 'NotoSansJP, sans-serif' : 'sans-serif';

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '1200px',
          height: '630px',
          background: '#0a0a0a',
          padding: '48px 56px',
          fontFamily,
        }}
      >
        <div style={{ display: 'flex', flex: 1, gap: '56px' }}>
          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', width: '500px' }}>
            <span style={{ fontSize: 15, color: '#666', marginBottom: '14px' }}>
              クソ記事チェッカー
            </span>
            <div
              style={{
                display: 'flex',
                alignSelf: 'flex-start',
                background: verdict.color,
                color: 'white',
                fontSize: 15,
                fontWeight: 700,
                padding: '4px 16px',
                borderRadius: '24px',
                marginBottom: '16px',
              }}
            >
              {verdict.label}
            </div>
            <span style={{ fontSize: 100, fontWeight: 700, color: verdict.color, lineHeight: '1' }}>
              {total}
            </span>
            <span style={{ fontSize: 34, fontWeight: 700, color: 'white', marginTop: '8px' }}>
              {verdict.verdict}
            </span>
            <span style={{ fontSize: 16, color: '#aaa', marginTop: '12px', lineHeight: '1.6' }}>
              {verdict.roast}
            </span>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 13, color: '#555', lineHeight: '1.5' }}>
              {comment.length > 70 ? comment.slice(0, 70) + '…' : comment}
            </span>
          </div>

          {/* Right – bar charts */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '480px',
              justifyContent: 'center',
              gap: '18px',
            }}
          >
            <span style={{ fontSize: 15, color: '#666', marginBottom: '4px' }}>
              クソ度分析（5軸）
            </span>
            {bars.map(([label, score]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '108px', fontSize: 14, color: '#ccc', textAlign: 'right' }}>
                  {label}
                </span>
                <div
                  style={{
                    width: `${BAR_MAX}px`,
                    height: '16px',
                    background: '#1e1e1e',
                    borderRadius: '4px',
                    display: 'flex',
                  }}
                >
                  <div
                    style={{
                      width: `${Math.round((score / 100) * BAR_MAX)}px`,
                      height: '16px',
                      background: verdict.color,
                      borderRadius: '4px',
                    }}
                  />
                </div>
                <span style={{ width: '32px', fontSize: 14, fontWeight: 700, color: verdict.color }}>
                  {score}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: '16px',
            borderTop: '1px solid #222',
            paddingTop: '12px',
          }}
        >
          <span style={{ fontSize: 13, color: '#444' }}>kuso-checker.vercel.app</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts }
  );
}
