export default defineEventHandler(async (event) => {
  const { url } = getQuery(event)
  if (!url || typeof url !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'URL required' })
  }

  const response = await fetch(url, {
    headers: { 'User-Agent': 'GroovApp/1.0' },
  })

  if (!response.ok) {
    throw createError({ statusCode: response.status, statusMessage: 'Image fetch failed' })
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  const contentType = response.headers.get('content-type') || 'image/jpeg'

  setResponseHeaders(event, {
    'Content-Type': contentType,
    'Cache-Control': 'public, max-age=86400',
  })

  return buffer
})
