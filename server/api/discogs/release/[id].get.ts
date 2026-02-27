export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Release ID is required' })
  }

  const query = getQuery(event)
  const curr = (query.curr_abbr as string) || 'EUR'

  const [release, stats] = await Promise.all([
    discogsGet<Record<string, unknown>>(`/releases/${id}`),
    discogsGet<Record<string, unknown>>(`/marketplace/stats/${id}`, { curr_abbr: curr }).catch(() => null),
  ])

  return {
    ...release,
    marketplace: stats,
  }
})
