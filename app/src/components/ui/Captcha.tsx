import { useEffect, useId, useRef } from 'react'
import { TURNSTILE_SITE_KEY } from '@/lib/captcha'

interface TurnstileRenderOptions {
  sitekey: string
  callback: (token: string) => void
  'expired-callback': () => void
  'error-callback': () => void
  theme?: 'light' | 'dark' | 'auto'
  size?: 'normal' | 'compact' | 'flexible'
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileRenderOptions) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
  }
}

let scriptPromise: Promise<void> | null = null

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve()
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Không tải được captcha, kiểm tra kết nối mạng.'))
    document.head.appendChild(script)
  })
  return scriptPromise
}

/**
 * Cloudflare Turnstile widget. Renders nothing when VITE_TURNSTILE_SITE_KEY isn't set, so forms
 * using it degrade the same way the rest of the app does when a backend piece isn't configured.
 * `resetKey` forces a fresh token render (tokens are single-use) — bump it after a failed submit.
 */
export function Captcha({ onToken, resetKey }: { onToken: (token: string | null) => void; resetKey?: unknown }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const domId = useId()

  useEffect(() => {
    if (!isCaptchaAvailable()) return
    let cancelled = false
    loadTurnstileScript().then(() => {
      if (cancelled || !containerRef.current || !window.turnstile) return
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: TURNSTILE_SITE_KEY as string,
        callback: (token) => onToken(token),
        'expired-callback': () => onToken(null),
        'error-callback': () => onToken(null),
        // The default 'normal' size is a hard-coded 300px wide. Auth.tsx's card leaves it
        // exactly 300px on a 375px-wide phone and LESS than that on the far more common
        // 360px-wide Android default — the widget was overflowing its rounded card there,
        // pushing part of the checkbox/challenge UI outside the visible, tappable area.
        // 'flexible' makes it fill (and shrink to) its container's actual width instead.
        size: 'flexible',
      })
    })
    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
    // resetKey intentionally re-mounts the widget to fetch a brand-new token.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  if (!isCaptchaAvailable()) return null

  return <div ref={containerRef} id={`turnstile-${domId}`} className="my-1 w-full" />
}

function isCaptchaAvailable() {
  return Boolean(TURNSTILE_SITE_KEY)
}
