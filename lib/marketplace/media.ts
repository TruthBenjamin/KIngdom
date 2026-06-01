export function isVideoMedia(url?: string | null) {
  if (!url) return false

  try {
    const pathname = new URL(url).pathname
    return /\.(mp4|mov|m4v|webm|quicktime)$/i.test(pathname)
  } catch {
    return /\.(mp4|mov|m4v|webm|quicktime)(\?.*)?$/i.test(url)
  }
}
