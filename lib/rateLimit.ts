const LIMIT = 3;

// In-memory fallback (per-process, resets on restart)
const inMemoryStore = new Map<string, { count: number; resetAt: number }>();

function getJSTMidnight(): number {
  const now = new Date();
  // JST = UTC+9
  const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const jstMidnight = new Date(
    Date.UTC(jstNow.getUTCFullYear(), jstNow.getUTCMonth(), jstNow.getUTCDate() + 1) -
    9 * 60 * 60 * 1000
  );
  return jstMidnight.getTime();
}

async function checkInMemory(ip: string): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now();
  const resetAt = getJSTMidnight();
  const entry = inMemoryStore.get(ip);

  if (!entry || now >= entry.resetAt) {
    inMemoryStore.set(ip, { count: 1, resetAt });
    return { allowed: true, remaining: LIMIT - 1 };
  }

  if (entry.count >= LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: LIMIT - entry.count };
}

function isAdminIP(ip: string): boolean {
  const raw = process.env.ADMIN_IPS ?? '';
  if (!raw) return false;
  return raw.split(',').map(s => s.trim()).includes(ip);
}

export async function peekRateLimit(ip: string): Promise<{ remaining: number }> {
  if (isAdminIP(ip)) {
    return { remaining: LIMIT };
  }

  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  if (kvUrl && kvToken) {
    try {
      const { kv } = await import('@vercel/kv');
      const count = (await kv.get<number>(`ratelimit:${ip}`)) ?? 0;
      return { remaining: Math.max(0, LIMIT - count) };
    } catch {
      // fall through
    }
  }

  // In-memory fallback
  const entry = inMemoryStore.get(ip);
  if (!entry || Date.now() >= entry.resetAt) {
    return { remaining: LIMIT };
  }
  return { remaining: Math.max(0, LIMIT - entry.count) };
}

export async function checkRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number }> {
  if (isAdminIP(ip)) {
    return { allowed: true, remaining: LIMIT };
  }
  // Try Vercel KV if configured
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  if (kvUrl && kvToken) {
    try {
      const { kv } = await import('@vercel/kv');
      const now = Date.now();
      const resetAt = getJSTMidnight();
      const ttlSeconds = Math.ceil((resetAt - now) / 1000);
      const key = `ratelimit:${ip}`;

      const count = await kv.incr(key);
      if (count === 1) {
        await kv.expire(key, ttlSeconds);
      }

      if (count > LIMIT) {
        return { allowed: false, remaining: 0 };
      }
      return { allowed: true, remaining: LIMIT - count };
    } catch {
      // KV unavailable — fall through to in-memory
    }
  }

  return checkInMemory(ip);
}
