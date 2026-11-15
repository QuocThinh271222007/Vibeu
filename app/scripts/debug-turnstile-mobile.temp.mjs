import puppeteer from 'puppeteer-core'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] })
const page = await browser.newPage()

// Emulate a real Android phone (viewport + UA + touch) — much closer to what the user is testing
// on than a desktop Puppeteer session.
await page.emulate({
  viewport: { width: 412, height: 915, isMobile: true, hasTouch: true, deviceScaleFactor: 2.6 },
  userAgent:
    'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36',
})

const events = []
page.on('console', (msg) => {
  const text = msg.text()
  if (/turnstile/i.test(text) || msg.type() === 'error') events.push(`[console:${msg.type()}] ${text}`)
})
page.on('pageerror', (err) => events.push(`[pageerror] ${err.message}`))
page.on('requestfailed', (req) => {
  if (/turnstile|cloudflare/i.test(req.url())) events.push(`[requestfailed] ${req.url()} ${req.failure()?.errorText}`)
})
page.on('response', (res) => {
  if (res.url().includes('turnstile') && res.status() >= 400) events.push(`[response ${res.status()}] ${res.url()}`)
})

await page.goto('https://vibeu.design/auth', { waitUntil: 'networkidle0', timeout: 45000 })

// Switch to the sign-up tab (the form the user reported the error on specifically)
const tabs = await page.$$('button')
for (const btn of tabs) {
  const text = await page.evaluate((el) => el.textContent, btn)
  if (text && /đăng ký/i.test(text) && !/bắt đầu/i.test(text)) {
    await btn.click()
    break
  }
}
await new Promise((r) => setTimeout(r, 4000))

// Poll for the turnstile response input Cloudflare injects once a token is issued
const tokenInfo = await page.evaluate(() => {
  const el = document.querySelector('input[name="cf-turnstile-response"]')
  return { found: Boolean(el), value: el?.value ? `${el.value.slice(0, 20)}... (len ${el.value.length})` : null }
})
console.log('turnstile response input:', JSON.stringify(tokenInfo))
console.log('--- events ---')
events.forEach((e) => console.log(e))

await browser.close()
