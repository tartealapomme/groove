export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Release ID is required' })
  }

  const query = getQuery(event)
  const curr = (query.curr_abbr as string) || 'EUR'

  const stats = await discogsGet<{
    lowest_price: { currency: string, value: number } | null
    num_for_sale: number | null
    blocked_from_sale: boolean
  }>(`/marketplace/stats/${id}`, { curr_abbr: curr })

  return stats
})
