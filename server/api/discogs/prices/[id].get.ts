export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Release ID is required' })
  }

  const suggestions = await discogsGet<Record<string, { currency: string, value: number }>>(
    `/marketplace/price_suggestions/${id}`,
  )

  return suggestions
})
