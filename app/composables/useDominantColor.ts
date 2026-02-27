export function useDominantColor() {
  const colorCache = new Map<string, string>()
  const FALLBACK = '#555555'

  function extractColor(src: string): Promise<string> {
    if (colorCache.has(src)) return Promise.resolve(colorCache.get(src)!)

    return new Promise((resolve) => {
      if (typeof window === 'undefined') { resolve(FALLBACK); return }

      const img = new window.Image()
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          const size = 10
          canvas.width = size
          canvas.height = size
          const ctx = canvas.getContext('2d')
          if (!ctx) { resolve(FALLBACK); return }

          ctx.drawImage(img, 0, 0, size, size)
          const data = ctx.getImageData(0, 0, size, size).data

          let bestR = 85, bestG = 85, bestB = 85, bestVividness = 0

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i] ?? 0
            const g = data[i + 1] ?? 0
            const b = data[i + 2] ?? 0
            const mx = Math.max(r, g, b)
            const mn = Math.min(r, g, b)
            const sat = mx - mn
            const brightness = (r + g + b) / 3
            if (brightness < 30 || brightness > 230) continue
            if (sat < 40) continue

            const vividness = sat * (1 + mx / 255)
            if (vividness > bestVividness) {
              bestVividness = vividness
              bestR = r
              bestG = g
              bestB = b
            }
          }

          const hex = `#${bestR.toString(16).padStart(2, '0')}${bestG.toString(16).padStart(2, '0')}${bestB.toString(16).padStart(2, '0')}`
          colorCache.set(src, hex)
          resolve(hex)
        }
        catch {
          resolve(FALLBACK)
        }
      }
      img.onerror = () => resolve(FALLBACK)
      img.src = `/api/img-proxy?url=${encodeURIComponent(src)}`
    })
  }

  return { extractColor }
}
