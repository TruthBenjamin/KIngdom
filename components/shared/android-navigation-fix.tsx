'use client'

import { useEffect } from 'react'

function isAndroidWebView() {
  if (typeof navigator === 'undefined') return false
  const userAgent = navigator.userAgent || ''
  return /Android/i.test(userAgent) && (/\bwv\b/i.test(userAgent) || /Version\/\d+\.\d+/i.test(userAgent))
}

function shouldHandleLink(anchor: HTMLAnchorElement, event: MouseEvent) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false
  if (anchor.target && anchor.target !== '_self') return false
  if (anchor.hasAttribute('download')) return false

  const href = anchor.getAttribute('href')
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('sms:')) return false

  const url = new URL(anchor.href, window.location.href)
  return url.origin === window.location.origin || url.pathname.startsWith('/')
}

export function AndroidNavigationFix() {
  useEffect(() => {
    if (!isAndroidWebView()) return

    const forceWebViewNavigation = (event: MouseEvent) => {
      const target = event.target as Element | null
      const anchor = target?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!anchor || !shouldHandleLink(anchor, event)) return

      event.preventDefault()
      event.stopPropagation()
      window.location.assign(anchor.href)
    }

    document.addEventListener('click', forceWebViewNavigation, true)
    return () => document.removeEventListener('click', forceWebViewNavigation, true)
  }, [])

  return null
}
