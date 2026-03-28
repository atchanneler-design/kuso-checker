import { NextRequest } from 'next/server';
import { getRedis } from '@/lib/redis';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const redis = getRedis();

  if (!redis) {
    return Response.json({ error: 'Storage not configured' }, { status: 503 });
  }

  const raw = await redis.get(`result:${id}`);
  if (!raw) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
  return Response.json(data);
}
