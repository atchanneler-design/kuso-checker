import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
})

// Check both patterns: rate:* (as specified) and ratelimit:* (actual key prefix in rateLimit.ts)
const keysA = await redis.keys('rate:*')
const keysB = await redis.keys('ratelimit:*')

console.log(`rate:*      → ${keysA.length}件: ${JSON.stringify(keysA)}`)
console.log(`ratelimit:* → ${keysB.length}件: ${JSON.stringify(keysB)}`)

const allKeys = [...new Set([...keysA, ...keysB])]
for (const key of allKeys) {
  await redis.del(key)
}
console.log(`\n削除したキー数: ${allKeys.length}`)
