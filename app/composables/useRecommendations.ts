export interface RecommendedVinyl {
  id: number
  title: string
  artist: string
  year: string
  thumb: string
  cover: string
  score: number
  reason: string
  community?: { want: number, have: number }
}

export function useRecommendations() {
  const { searchReleases } = useDiscogs()
  const { prefs, ensureLoaded: ensurePrefsLoaded } = useUserPrefs()
  const { collection, ensureLoaded: ensureCollectionLoaded } = useUserCollection()
  const { favorites, ensureLoaded: ensureFavoritesLoaded } = useUserFavorites()

  function parseResult(r: { id: number, title: string, thumb: string, cover_image: string, year: string, genre?: string[], community?: { want: number, have: number } }) {
    return {
      id: r.id,
      title: r.title.includes(' - ') ? r.title.split(' - ').slice(1).join(' - ') : r.title,
      artist: r.title.includes(' - ') ? r.title.split(' - ')[0] : '',
      year: r.year || '',
      thumb: r.thumb,
      cover: r.cover_image,
      community: r.community,
    }
  }

  function getCollectionGenreWeights(): Map<string, number> {
    const weights = new Map<string, number>()
    for (const item of collection.value) {
      for (const genre of (item.genre ?? [])) {
        weights.set(genre, (weights.get(genre) ?? 0) + 2)
      }
    }
    for (const item of favorites.value) {
      // Favorites don't have genre, but we count them for artist matching
    }
    return weights
  }

  function getCollectionArtistWeights(): Map<string, number> {
    const weights = new Map<string, number>()
    for (const item of collection.value) {
      if (item.artist) {
        weights.set(item.artist, (weights.get(item.artist) ?? 0) + 3)
      }
    }
    for (const item of favorites.value) {
      if (item.artist) {
        weights.set(item.artist, (weights.get(item.artist) ?? 0) + 2)
      }
    }
    return weights
  }

  function getOwnedIds(): Set<number> {
    const ids = new Set<number>()
    for (const item of collection.value) ids.add(item.discogs_id)
    for (const item of favorites.value) ids.add(item.discogs_id)
    return ids
  }

  async function getRecommendations(limit = 12): Promise<RecommendedVinyl[]> {
    await Promise.all([ensurePrefsLoaded(), ensureCollectionLoaded(), ensureFavoritesLoaded()])

    const genreWeights = getCollectionGenreWeights()
    const artistWeights = getCollectionArtistWeights()
    const ownedIds = getOwnedIds()

    // Build search queries from preferences + collection data
    const prefGenres = prefs.value.genres
    const prefArtists = prefs.value.artists

    // Add preference genres with weight
    for (const genre of prefGenres) {
      genreWeights.set(genre, (genreWeights.get(genre) ?? 0) + 3)
    }
    for (const artist of prefArtists) {
      artistWeights.set(artist, (artistWeights.get(artist) ?? 0) + 4)
    }

    // Sort by weight, take top entries for search
    const topGenres = [...genreWeights.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([g]) => g)

    const topArtists = [...artistWeights.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([a]) => a)

    if (topGenres.length === 0 && topArtists.length === 0) return []

    const allResults: RecommendedVinyl[] = []

    // Parallel searches: by top genres + by top artists
    const searches = [
      ...topGenres.map(genre =>
        searchReleases({ genre, per_page: 10, sort: 'want', sort_order: 'desc' })
          .then(res => res.results.map(r => ({ ...parseResult(r), score: genreWeights.get(genre) ?? 1, reason: `Genre : ${genre}` })))
          .catch(() => [] as RecommendedVinyl[]),
      ),
      ...topArtists.map(artist =>
        searchReleases({ q: artist, per_page: 8, sort: 'want', sort_order: 'desc' })
          .then(res => res.results.map(r => ({ ...parseResult(r), score: (artistWeights.get(artist) ?? 1) * 1.5, reason: `Artiste : ${artist}` })))
          .catch(() => [] as RecommendedVinyl[]),
      ),
    ]

    const results = await Promise.all(searches)
    for (const batch of results) allResults.push(...batch)

    // Deduplicate by id and by title+artist, exclude owned, score & sort
    const seenIds = new Set<number>()
    const seenTitles = new Set<string>()
    const unique: RecommendedVinyl[] = []
    for (const item of allResults) {
      if (seenIds.has(item.id) || ownedIds.has(item.id)) continue
      const titleKey = `${(item.artist || '').toLowerCase().trim()}|${(item.title || '').toLowerCase().trim()}`
      if (seenTitles.has(titleKey)) continue

      seenIds.add(item.id)
      seenTitles.add(titleKey)

      // Boost score based on community want
      const wantBoost = item.community ? Math.log10(item.community.want + 1) : 0
      item.score += wantBoost

      unique.push(item)
    }

    unique.sort((a, b) => b.score - a.score)
    return unique.slice(0, limit)
  }

  return { getRecommendations }
}
