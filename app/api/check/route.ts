import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { nanoid } from 'nanoid';
import crypto from 'crypto';
import { SYSTEM_PROMPT, selectModel } from '@/lib/prompt';
import { checkRateLimit } from '@/lib/rateLimit';
import { getRedis, RESULT_TTL } from '@/lib/redis';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const { allowed } = await checkRateLimit(ip);

  if (!allowed) {
    return Response.json(
      { error: '1日の利用上限（3回）に達しました。明日またご利用ください。' },
      { status: 429 }
    );
  }

  let text: string;
  try {
    const body = await request.json();
    text = body.text;
  } catch {
    return Response.json({ error: '不正なリクエストです。' }, { status: 400 });
  }

  if (!text || typeof text !== 'string') {
    return Response.json({ error: 'テキストを入力してください。' }, { status: 400 });
  }

  if (text.length > 20000) {
    return Response.json({ error: '20,000文字以内で入力してください。' }, { status: 400 });
  }

  const redis = getRedis();
  const textHash = crypto.createHash('sha256').update(text).digest('hex');
  const cacheKey = `hash:${textHash}`;

  if (redis) {
    try {
      const cachedId = await redis.get<string>(cacheKey);
      if (cachedId) {
        const cachedResultStr = await redis.get(`result:${cachedId}`);
        if (cachedResultStr) {
          const cachedResult = typeof cachedResultStr === 'string' ? JSON.parse(cachedResultStr) : cachedResultStr;
          return Response.json({ ...cachedResult, id: cachedId });
        }
      }
    } catch { /* ignore */ }
  }

  const model = selectModel(text.length);

  let rawText = '';
  try {
    const message = await anthropic.messages.create({
      model,
      max_tokens: 2048,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: text }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      console.error('[check] Unexpected content type:', content.type);
      throw new Error('Unexpected response type');
    }

    rawText = content.text;
    
    // AIの回答からJSON文字列（ { 〜 } ）だけを抜き出す安全なパース
    const firstBraceIndex = rawText.indexOf('{');
    const lastBraceIndex = rawText.lastIndexOf('}');
    
    if (firstBraceIndex === -1 || lastBraceIndex === -1) {
      console.error('[check] JSON braces not found in Claude response:', rawText);
      throw new Error('No JSON structure found in response');
    }
    
    const cleaned = rawText.substring(firstBraceIndex, lastBraceIndex + 1);
    const result = JSON.parse(cleaned);

    // Persist to Redis and return id
    const id = nanoid(8);
    if (redis) {
      try {
        await redis.set(`result:${id}`, JSON.stringify(result), { ex: RESULT_TTL });
        await redis.set(cacheKey, id, { ex: RESULT_TTL });
      } catch (e) {
        console.error('[check] Redis save error:', e);
      }
    }

    return Response.json({ ...result, id });
  } catch (error) {
    console.error('[check] Error:', error);
    console.error('[check] Raw Claude response:', rawText);
    return Response.json(
      { error: '判定に失敗しました。もう一度お試しください。' },
      { status: 500 }
    );
  }
}
