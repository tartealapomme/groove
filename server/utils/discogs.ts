const DISCOGS_BASE = 'https://api.discogs.com'
const USER_AGENT = 'GroovApp/1.0 +https://groov.app'
const CACHE_TTL = 5 * 60 * 1000 // 5 min

interface CacheEntry<T> {
  data: T
  expiry: number
}

const cache = new Map<string, CacheEntry<unknown>>()

function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined
  if (!entry) return null
  if (Date.now() > entry.expiry) {
    cache.delete(key)
    return null
  }
  return entry.data
}

function setCache<T>(key: string, data: T, ttl = CACHE_TTL) {
  cache.set(key, { data, expiry: Date.now() + ttl })
}

export async function discogsGet<T = unknown>(
  path: string,
  params: Record<string, string | number | undefined> = {},
): Promise<T> {
  const token = process.env.DISCOGS_TOKEN || ''

  const url = new URL(`${DISCOGS_BASE}${path}`)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value))
    }
  }

  const cacheKey = url.toString()
  const cached = getCached<T>(cacheKey)
  if (cached) return cached

  const headers: Record<string, string> = {
    'User-Agent': USER_AGENT,
    'Accept': 'application/vnd.discogs.v2.discogs+json',
  }

  if (token && token !== 'placeholder') {
    headers['Authorization'] = `Discogs token=${token}`
  }

  const response = await fetch(url.toString(), { headers })

  if (!response.ok) {
    throw createError({
      statusCode: response.status,
      statusMessage: `Discogs API error: ${response.statusText}`,
    })
  }

  const data = (await response.json()) as T
  setCache(cacheKey, data)
  return data
}
