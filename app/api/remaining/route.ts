import { NextRequest } from 'next/server';
import { peekRateLimit } from '@/lib/rateLimit';

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

export async function GET(request: NextRequest) {
  const ip = getClientIP(request);
  const { remaining } = await peekRateLimit(ip);
  return Response.json({ remaining });
}
