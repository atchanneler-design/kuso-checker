import { NextRequest } from 'next/server';
import { rewardRateLimit } from '@/lib/rateLimit';

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  await rewardRateLimit(ip);
  return Response.json({ ok: true });
}
