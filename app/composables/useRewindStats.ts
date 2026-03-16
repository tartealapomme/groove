import type { DiscogsSearchResult } from './useDiscogs'

export interface CountryCoords {
  name: string
  lat: number
  lon: number
  count: number
}

export interface RewindStats {
  topCountries: CountryCoords[]
  topGenres: { name: string, count: number }[]
  topArtists: { name: string, count: number }[]
  decades: { decade: string, count: number }[]
  topLabels: { name: string, count: number }[]
  rarestVinyl: { title: string, artist: string, cover: string, want: number, have: number, ratio: number } | null
  totalCountries: number
  totalVinyls: number
}

const COUNTRY_COORDS: Record<string, [number, number]> = {
  US: [39.8, -98.6],
  UK: [54.0, -2.0],
  Germany: [51.2, 10.4],
  France: [46.6, 2.2],
  Japan: [36.2, 138.3],
  Canada: [56.1, -106.3],
  Italy: [42.5, 12.5],
  Australia: [-25.3, 133.8],
  Brazil: [-14.2, -51.9],
  Netherlands: [52.1, 5.3],
  Spain: [40.5, -3.7],
  Sweden: [60.1, 18.6],
  Belgium: [50.5, 4.5],
  Jamaica: [18.1, -77.3],
  Mexico: [23.6, -102.6],
  Argentina: [-38.4, -63.6],
  Colombia: [4.6, -74.3],
  'South Africa': [-30.6, 22.9],
  Nigeria: [9.1, 8.7],
  India: [20.6, 79.0],
  Russia: [61.5, 105.3],
  Poland: [51.9, 19.1],
  Portugal: [39.4, -8.2],
  Greece: [39.1, 21.8],
  Austria: [47.5, 14.6],
  Switzerland: [46.8, 8.2],
  Denmark: [56.3, 9.5],
  Norway: [60.5, 8.5],
  Finland: [61.9, 25.7],
  Ireland: [53.1, -8.2],
  'New Zealand': [-40.9, 174.9],
  Cuba: [21.5, -77.8],
  'South Korea': [35.9, 127.8],
  Turkey: [39.0, 35.2],
  Israel: [31.0, 34.9],
  Chile: [-35.7, -71.5],
  Peru: [-9.2, -75.0],
  Venezuela: [6.4, -66.6],
  Europe: [50.0, 10.0],
  Unknown: [0, 0],
}

export function useRewindStats(results: Ref<DiscogsSearchResult[]>) {
  const stats = computed<RewindStats>(() => {
    const items = results.value
    if (!items.length) {
      return {
        topCountries: [],
        topGenres: [],
        topArtists: [],
        decades: [],
        topLabels: [],
        rarestVinyl: null,
        totalCountries: 0,
        totalVinyls: 0,
      }
    }

    const countryMap = new Map<string, number>()
    const genreMap = new Map<string, number>()
    const artistMap = new Map<string, number>()
    const decadeMap = new Map<string, number>()
    const labelMap = new Map<string, number>()

    let rarest: RewindStats['rarestVinyl'] = null
    let bestRatio = 0

    for (const r of items) {
      const country = r.country || 'Unknown'
      countryMap.set(country, (countryMap.get(country) ?? 0) + 1)

      for (const g of r.genre ?? []) {
        genreMap.set(g, (genreMap.get(g) ?? 0) + 1)
      }

      const artist = r.title.includes(' - ') ? r.title.split(' - ')[0]?.trim() : ''
      if (artist) {
        artistMap.set(artist, (artistMap.get(artist) ?? 0) + 1)
      }

      if (r.year) {
        const dec = `${r.year.substring(0, 3)}0s`
        decadeMap.set(dec, (decadeMap.get(dec) ?? 0) + 1)
      }

      const label = r.label?.[0]
      if (label) {
        labelMap.set(label, (labelMap.get(label) ?? 0) + 1)
      }

      const want = r.community?.want ?? 0
      const have = r.community?.have ?? 0
      const ratio = have > 0 ? want / have : want
      if (ratio > bestRatio) {
        bestRatio = ratio
        rarest = {
          title: r.title.includes(' - ') ? r.title.split(' - ').slice(1).join(' - ') : r.title,
          artist: r.title.includes(' - ') ? r.title.split(' - ')[0]?.trim() ?? '' : '',
          cover: r.cover_image || r.thumb,
          want,
          have,
          ratio,
        }
      }
    }

    function sortedEntries(map: Map<string, number>, limit = 5) {
      return [...map.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([name, count]) => ({ name, count }))
    }

    const topCountries: CountryCoords[] = [...countryMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => {
        const coords = COUNTRY_COORDS[name] ?? [0, 0]
        return { name, lat: coords[0], lon: coords[1], count }
      })

    const decades = [...decadeMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([decade, count]) => ({ decade, count }))

    return {
      topCountries,
      topGenres: sortedEntries(genreMap, 6),
      topArtists: sortedEntries(artistMap, 5),
      decades,
      topLabels: sortedEntries(labelMap, 5),
      rarestVinyl: rarest,
      totalCountries: countryMap.size,
      totalVinyls: items.length,
    }
  })

  return { stats }
}
