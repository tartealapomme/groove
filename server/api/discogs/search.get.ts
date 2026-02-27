export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const params: Record<string, string | number | undefined> = {
    q: query.q as string | undefined,
    type: (query.type as string) || 'release',
    genre: query.genre as string | undefined,
    style: query.style as string | undefined,
    year: query.year as string | undefined,
    country: query.country as string | undefined,
    format: (query.format as string) || 'vinyl',
    label: query.label as string | undefined,
    artist: query.artist as string | undefined,
    catno: query.catno as string | undefined,
    barcode: query.barcode as string | undefined,
    sort: query.sort as string | undefined,
    sort_order: query.sort_order as string | undefined,
    page: query.page ? Number(query.page) : 1,
    per_page: query.per_page ? Number(query.per_page) : 20,
  }

  return discogsGet('/database/search', params)
})
