export interface DiscogsSearchResult {
  id: number
  type: string
  title: string
  thumb: string
  cover_image: string
  uri: string
  country: string
  year: string
  genre: string[]
  style: string[]
  format: string[]
  label: string[]
  catno: string
  resource_url: string
  community: { want: number, have: number }
}

export interface DiscogsPagination {
  page: number
  pages: number
  per_page: number
  items: number
  urls: Record<string, string>
}

export interface DiscogsSearchResponse {
  pagination: DiscogsPagination
  results: DiscogsSearchResult[]
}

export interface DiscogsTrack {
  position: string
  title: string
  duration: string
  type_: string
  extraartists?: { name: string, role: string }[]
}

export interface DiscogsImage {
  type: string
  uri: string
  uri150: string
  width: number
  height: number
  resource_url: string
}

export interface DiscogsRelease {
  id: number
  title: string
  artists: { name: string, id: number }[]
  year: number
  genres: string[]
  styles: string[]
  labels: { name: string, catno: string, id: number }[]
  formats: { name: string, qty: string, descriptions: string[] }[]
  tracklist: DiscogsTrack[]
  images: DiscogsImage[]
  country: string
  notes: string
  community: {
    want: number
    have: number
    rating: { count: number, average: number }
  }
  marketplace?: {
    lowest_price: { currency: string, value: number } | null
    num_for_sale: number | null
    blocked_from_sale: boolean
  }
}

export interface DiscogsMarketplaceStats {
  lowest_price: { currency: string, value: number } | null
  num_for_sale: number | null
  blocked_from_sale: boolean
}

export interface DiscogsPriceSuggestions {
  [condition: string]: { currency: string, value: number }
}

export function useDiscogs() {
  async function searchReleases(params: {
    q?: string
    genre?: string
    style?: string
    year?: string
    artist?: string
    format?: string
    sort?: string
    sort_order?: string
    page?: number
    per_page?: number
  } = {}) {
    return $fetch<DiscogsSearchResponse>('/api/discogs/search', { params })
  }

  async function getRelease(id: number | string) {
    return $fetch<DiscogsRelease>(`/api/discogs/release/${id}`)
  }

  async function getMarketplaceStats(id: number | string, currency = 'EUR') {
    return $fetch<DiscogsMarketplaceStats>(`/api/discogs/marketplace/${id}`, {
      params: { curr_abbr: currency },
    })
  }

  async function getPriceSuggestions(id: number | string) {
    return $fetch<DiscogsPriceSuggestions>(`/api/discogs/prices/${id}`)
  }

  return {
    searchReleases,
    getRelease,
    getMarketplaceStats,
    getPriceSuggestions,
  }
}
