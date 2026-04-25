import express from 'express'
import cors from 'cors'
import { readFileSync, writeFileSync, existsSync } from 'fs'

// Load .env manually (no dotenv dep needed beyond what we have)
const env = {}
try {
  readFileSync('.env', 'utf8').split('\n').forEach(line => {
    const [k, v] = line.split('=')
    if (k && v) env[k.trim()] = v.trim()
  })
} catch {}

const KLAVIYO_KEY   = env.KLAVIYO_KEY   || process.env.KLAVIYO_KEY
const BUFFER_TOKEN  = env.BUFFER_TOKEN  || process.env.BUFFER_TOKEN
const KLAVIYO_BASE  = 'https://a.klaviyo.com/api'
const BUFFER_BASE   = 'https://api.bufferapp.com/1'

const kGetHeaders = {
  Authorization: `Klaviyo-API-Key ${KLAVIYO_KEY}`,
  revision: '2024-10-15',
  Accept: 'application/json',
}
const kPostHeaders = { ...kGetHeaders, 'Content-Type': 'application/json' }

const app = express()
app.use(cors())
app.use(express.json())

// ── helpers ──────────────────────────────────────────────────────────────────

async function kGet(path) {
  const r = await fetch(`${KLAVIYO_BASE}${path}`, { headers: kGetHeaders })
  if (!r.ok) throw new Error(`Klaviyo ${r.status}: ${await r.text()}`)
  return r.json()
}

async function kPost(path, body) {
  const r = await fetch(`${KLAVIYO_BASE}${path}`, {
    method: 'POST', headers: kPostHeaders, body: JSON.stringify(body),
  })
  if (!r.ok) throw new Error(`Klaviyo POST ${r.status}: ${await r.text()}`)
  return r.json()
}

async function bGet(path) {
  const sep = path.includes('?') ? '&' : '?'
  const r = await fetch(`${BUFFER_BASE}${path}${sep}access_token=${BUFFER_TOKEN}`)
  if (!r.ok) throw new Error(`Buffer ${r.status}: ${await r.text()}`)
  return r.json()
}

function iso(d) { return d.toISOString().replace('.000', '') }

// ── Klaviyo: account info ─────────────────────────────────────────────────────
app.get('/api/klaviyo/account', async (req, res) => {
  try {
    const data = await kGet('/accounts/')
    res.json(data)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Klaviyo: all metrics (used to find metric IDs) ────────────────────────────
app.get('/api/klaviyo/metrics', async (req, res) => {
  try {
    const data = await kGet('/metrics/')
    res.json(data)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Klaviyo: KPI summary ──────────────────────────────────────────────────────
// Finds the key metric IDs then pulls 7-day aggregates
app.get('/api/klaviyo/kpis', async (req, res) => {
  try {
    const metricsRes = await kGet('/metrics/')
    const metrics    = metricsRes.data || []

    const find = name => metrics.find(m =>
      m.attributes.name.toLowerCase().includes(name.toLowerCase())
    )?.id

    const metricMap = {
      placedOrder:    find('Placed Order'),
      openedEmail:    find('Opened Email'),
      clickedEmail:   find('Clicked Email'),
      receivedEmail:  find('Received Email'),
      clickedSms:     find('Clicked SMS'),
      receivedSms:    find('Received SMS'),
      abandonedCart:  find('Started Checkout'),
    }

    const now   = new Date()
    const start7 = new Date(now); start7.setDate(start7.getDate() - 7)
    const start1 = new Date(now); start1.setDate(start1.getDate() - 1)
    const filter7 = [`greater-or-equal(datetime,${iso(start7)})`, `less-than(datetime,${iso(now)})`]
    const filter1 = [`greater-or-equal(datetime,${iso(start1)})`, `less-than(datetime,${iso(now)})`]

    async function aggregate(metricId, measurements, filterArr) {
      if (!metricId) return null
      const body = {
        data: {
          type: 'metric-aggregate',
          attributes: {
            metric_id: metricId,
            measurements,
            interval: 'day',
            filter: filterArr,
            page_size: 10,
          },
        },
      }
      return kPost('/metric-aggregates/', body)
    }

    function sumResults(res, measure) {
      if (!res?.data?.attributes?.values) return 0
      const idx = res.data.attributes.measurements.indexOf(measure)
      if (idx === -1) return 0
      return res.data.attributes.values.reduce((s, v) => s + (v[idx] || 0), 0)
    }

    const [orders1d, ordersRev1d, openedEmail7d, clickedEmail7d,
           receivedEmail7d, clickedSms7d, receivedSms7d, cartStarted7d] = await Promise.allSettled([
      aggregate(metricMap.placedOrder,   ['count'],              filter1),
      aggregate(metricMap.placedOrder,   ['sum_value'],          filter1),
      aggregate(metricMap.openedEmail,   ['count'],              filter7),
      aggregate(metricMap.clickedEmail,  ['count'],              filter7),
      aggregate(metricMap.receivedEmail, ['count'],              filter7),
      aggregate(metricMap.clickedSms,    ['count'],              filter7),
      aggregate(metricMap.receivedSms,   ['count'],              filter7),
      aggregate(metricMap.abandonedCart, ['count'],              filter7),
    ])

    const val = r => r.status === 'fulfilled' ? r.value : null

    const ordersToday  = sumResults(val(orders1d), 'count')
    const revenueToday = sumResults(val(ordersRev1d), 'sum_value')
    const emailClicks  = sumResults(val(clickedEmail7d), 'count')
    const emailReceived = sumResults(val(receivedEmail7d), 'count')
    const smsClicks    = sumResults(val(clickedSms7d), 'count')
    const smsReceived  = sumResults(val(receivedSms7d), 'count')

    res.json({
      metricMap,
      kpis: {
        revenueToday:  `$${revenueToday.toFixed(0)}`,
        ordersToday:   `${ordersToday}`,
        emailClickRate: emailReceived > 0 ? `${((emailClicks / emailReceived) * 100).toFixed(1)}%` : '—',
        smsClickRate:   smsReceived   > 0 ? `${((smsClicks   / smsReceived)   * 100).toFixed(1)}%` : '—',
        cartAbandoned:  `${sumResults(val(cartStarted7d), 'count')} started`,
      },
    })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Klaviyo: campaigns ────────────────────────────────────────────────────────
app.get('/api/klaviyo/campaigns', async (req, res) => {
  try {
    const data = await kGet('/campaigns/?filter=equals(messages.channel,%27email%27)&sort=-created_at')
    res.json(data)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Klaviyo: flows ────────────────────────────────────────────────────────────
app.get('/api/klaviyo/flows', async (req, res) => {
  try {
    const data = await kGet('/flows/?sort=-created')
    res.json(data)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Klaviyo: lists ────────────────────────────────────────────────────────────
app.get('/api/klaviyo/lists', async (req, res) => {
  try {
    const data = await kGet('/lists/')
    res.json(data)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Buffer: all profiles ──────────────────────────────────────────────────────
app.get('/api/buffer/profiles', async (req, res) => {
  try {
    const data = await bGet('/profiles.json')
    res.json(data)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Buffer: pending updates across all profiles ───────────────────────────────
app.get('/api/buffer/pending', async (req, res) => {
  try {
    const profiles = await bGet('/profiles.json')
    const results = await Promise.allSettled(
      profiles.map(p => bGet(`/profiles/${p.id}/updates/pending.json?count=20`))
    )
    const posts = results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value.updates || [])
      .sort((a, b) => a.due_at - b.due_at)
    res.json({ posts, profiles })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ── Buffer via Make.com webhook ───────────────────────────────────────────────
const BUFFER_STORE = './buffer_posts.json'

function loadBufferPosts() {
  try { return JSON.parse(readFileSync(BUFFER_STORE, 'utf8')) } catch { return [] }
}
function saveBufferPosts(posts) {
  writeFileSync(BUFFER_STORE, JSON.stringify(posts, null, 2))
}

// Make.com POSTs here with Buffer post data
app.post('/api/webhook/buffer', (req, res) => {
  try {
    const incoming = Array.isArray(req.body) ? req.body : [req.body]
    const posts = incoming.map(p => ({
      id:        p.id || `mk_${Date.now()}_${Math.random()}`,
      text:      p.text || p.content || p.message || '',
      due_at:    p.due_at || p.scheduled_at || p.due || null,
      service:   p.profile_service || p.service || p.network || 'buffer',
      profile:   p.profile_name || p.profile || '',
      status:    p.status || 'scheduled',
      receivedAt: new Date().toISOString(),
    }))
    const existing = loadBufferPosts()
    // Merge — replace by id, append new
    const map = Object.fromEntries(existing.map(p => [p.id, p]))
    posts.forEach(p => { map[p.id] = p })
    const merged = Object.values(map).sort((a, b) => (a.due_at || 0) - (b.due_at || 0))
    saveBufferPosts(merged)
    console.log(`📥  Make.com webhook: received ${posts.length} Buffer post(s)`)
    res.json({ ok: true, received: posts.length, total: merged.length })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Frontend reads stored posts
app.get('/api/webhook/buffer', (req, res) => {
  res.json({ posts: loadBufferPosts() })
})

// Clear stored posts
app.delete('/api/webhook/buffer', (req, res) => {
  saveBufferPosts([])
  res.json({ ok: true })
})

app.listen(3457, () => {
  console.log('✅  API proxy ready → http://localhost:3457')
  console.log('📡  Make.com webhook → POST http://localhost:3457/api/webhook/buffer')
})
