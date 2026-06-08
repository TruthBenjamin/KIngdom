const androidLocalHost = 'kingdom.local'
const fallbackSiteOrigin = 'https://kiingdom.vercel.app'

export function marketplaceCategoryHref(slug: string, params: Record<string, string | undefined> = {}) {
  const query = new URLSearchParams()
  query.set('category', slug)

  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value)
  })

  return `/marketplace?${query.toString()}`
}

export function authRedirectOrigin() {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || fallbackSiteOrigin
  }

  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  if (configuredOrigin) return configuredOrigin

  if (window.location.hostname === androidLocalHost) return fallbackSiteOrigin
  if (window.location.hostname === 'localhost') return fallbackSiteOrigin

  return window.location.origin
}
