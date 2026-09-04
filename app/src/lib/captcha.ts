export const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY

/**
 * False when no Turnstile site key is configured — every form that would show a captcha widget
 * just skips it instead (mirrors isSupabaseConfigured's demo-mode fallback pattern). Real
 * bot-blocking additionally requires pasting the matching Turnstile SECRET key into Supabase
 * Dashboard -> Authentication -> Attack Protection -> Enable CAPTCHA protection.
 */
export const isCaptchaConfigured = Boolean(TURNSTILE_SITE_KEY)
