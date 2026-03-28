import { NextRequest } from 'next/server';
import * as cheerio from 'cheerio';

const PRIVATE_IP_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
];

function isPrivateOrLocalhost(hostname: string): boolean {
  return PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(hostname));
}

export async function POST(request: NextRequest) {
  let url: string;
  try {
    const body = await request.json();
    url = body.url;
  } catch {
    return Response.json({ error: '不正なリクエストです。' }, { status: 400 });
  }

  if (!url || typeof url !== 'string') {
    return Response.json({ error: 'URLを入力してください。' }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return Response.json({ error: '有効なURLを入力してください。' }, { status: 400 });
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return Response.json({ error: '有効なURLを入力してください。' }, { status: 400 });
  }

  if (isPrivateOrLocalhost(parsed.hostname)) {
    return Response.json({ error: 'このURLにはアクセスできません。' }, { status: 403 });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    let response: Response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; KusoChecker/1.0)',
        },
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      return Response.json(
        { error: 'このページは取得できませんでした。X(Twitter)などログインが必要なページは、テキストタブからテキストを直接コピー&ペーストしてください。' },
        { status: 422 }
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove script, style, nav, header, footer elements
    $('script, style, nav, header, footer, aside, noscript, iframe').remove();

    // Extract title and body text
    const title = $('title').text().trim();
    const body = $('body').text().replace(/\s+/g, ' ').trim();

    const text = title ? `${title}\n\n${body}` : body;

    if (!text || text.length < 50) {
      return Response.json(
        { error: 'このページは取得できませんでした。X(Twitter)などログインが必要なページは、テキストタブからテキストを直接コピー&ペーストしてください。' },
        { status: 422 }
      );
    }

    // Truncate to 20000 chars
    const truncated = text.slice(0, 20000);
    return Response.json({ text: truncated });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return Response.json(
        { error: 'ページの取得に時間がかかりすぎました。' },
        { status: 408 }
      );
    }
    return Response.json(
      { error: 'ページを取得できませんでした。テキストタブから貼り付けてください。' },
      { status: 422 }
    );
  }
}
