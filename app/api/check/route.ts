import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT, selectModel } from '@/lib/prompt';
import { checkRateLimit } from '@/lib/rateLimit';

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
      { error: '1日の利用上限（20回）に達しました。明日またご利用ください。' },
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

  const model = selectModel(text.length);

  try {
    const message = await anthropic.messages.create({
      model,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: text }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const cleaned = content.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const result = JSON.parse(cleaned);
    return Response.json(result);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: '判定に失敗しました。もう一度お試しください。' },
      { status: 500 }
    );
  }
}
