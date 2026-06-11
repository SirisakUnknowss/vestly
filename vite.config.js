import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import https from 'https'
import http from 'http'

// ── Yahoo Finance proxy with crumb/cookie management ─────────────
let yfCookie = ''
let yfCrumb  = ''
let crumbExpiry = 0

function fetchYahoo(url, cookie = '') {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const opts = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/json,*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://finance.yahoo.com/',
        ...(cookie ? { Cookie: cookie } : {}),
      },
    }
    const req = https.request(opts, res => {
      let data = ''
      const cookies = (res.headers['set-cookie'] || []).map(c => c.split(';')[0]).join('; ')
      res.on('data', chunk => data += chunk)
      res.on('end', () => resolve({ status: res.statusCode, data, cookies, headers: res.headers }))
    })
    req.on('error', reject)
    req.end()
  })
}

async function ensureCrumb() {
  if (yfCrumb && Date.now() < crumbExpiry) return true
  try {
    // Step 1: get cookie from yahoo finance homepage
    const home = await fetchYahoo('https://finance.yahoo.com/quote/AAPL')
    if (home.cookies) yfCookie = home.cookies

    // Step 2: get crumb
    const crumbRes = await fetchYahoo(
      'https://query1.finance.yahoo.com/v1/test/getcrumb',
      yfCookie
    )
    if (crumbRes.status === 200 && crumbRes.data && !crumbRes.data.includes('{')) {
      yfCrumb = crumbRes.data.trim()
      crumbExpiry = Date.now() + 55 * 60 * 1000 // 55 min
      console.log('[YF proxy] crumb refreshed:', yfCrumb.slice(0, 8) + '...')
      return true
    }
  } catch (e) {
    console.warn('[YF proxy] crumb error:', e.message)
  }
  return false
}

const yahooProxyPlugin = {
  name: 'yahoo-finance-proxy',
  configureServer(server) {
    server.middlewares.use('/yfchart', async (req, res) => {
      try {
        await ensureCrumb()
        // Parse query from request URL
        const reqUrl = new URL(req.url, 'http://localhost')
        const symbol   = reqUrl.searchParams.get('symbol')
        const interval = reqUrl.searchParams.get('interval') || '1d'
        const range    = reqUrl.searchParams.get('range')    || '1mo'

        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}&includePrePost=false${yfCrumb ? `&crumb=${encodeURIComponent(yfCrumb)}` : ''}`
        const result = await fetchYahoo(url, yfCookie)

        // If crumb expired, refresh and retry once
        if (result.status === 401 || result.status === 403) {
          yfCrumb = ''; yfCookie = ''
          await ensureCrumb()
          const retry = await fetchYahoo(
            `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}&includePrePost=false${yfCrumb ? `&crumb=${encodeURIComponent(yfCrumb)}` : ''}`,
            yfCookie
          )
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.statusCode = retry.status
          res.end(retry.data)
          return
        }

        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.statusCode = result.status
        res.end(result.data)
      } catch (e) {
        res.statusCode = 500
        res.end(JSON.stringify({ error: e.message }))
      }
    })
  }
}

export default defineConfig({
  base: '/vestly/',
  plugins: [
    react(),
    tailwindcss(),
    yahooProxyPlugin,
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png'],
      manifest: {
        name: 'Vestly Stock Tracker',
        short_name: 'Vestly',
        description: 'Track your favorite stocks and analyze the market.',
        theme_color: '#111827',
        background_color: '#030712',
        display: 'standalone',
        icons: [
          {
            src: 'logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    }),
  ],
  optimizeDeps: {
    include: ['tslib']
  }
})
