// Cloudflare Pages Function — catch-all for /api/*
// Mirrors the local Express server but runs on the edge

const KLAVIYO_BASE = 'https://a.klaviyo.com/api'

const kHeaders = key => ({
  Authorization: `Klaviyo-API-Key ${key}`,
  revision: '2024-10-15',
  Accept: 'application/json',
})
const kPostHeaders = key => ({
  ...kHeaders(key),
  'Content-Type': 'application/json',
})

async function kGet(path, key) {
  const r = await fetch(`${KLAVIYO_BASE}${path}`, { headers: kHeaders(key) })
  if (!r.ok) throw new Error(`Klaviyo ${r.status}: ${await r.text()}`)
  return r.json()
}

async function kPost(path, body, key) {
  const r = await fetch(`${KLAVIYO_BASE}${path}`, {
    method: 'POST', headers: kPostHeaders(key), body: JSON.stringify(body),
  })
  if (!r.ok) throw new Error(`Klaviyo POST ${r.status}: ${await r.text()}`)
  return r.json()
}

function iso(d) { return d.toISOString().slice(0, 19) }

function sumResults(res, measure) {
  if (!res?.data?.attributes?.values) return 0
  const idx = res.data.attributes.measurements.indexOf(measure)
  if (idx === -1) return 0
  return res.data.attributes.values.reduce((s, v) => s + (v[idx] || 0), 0)
}

async function handleKpis(KLAVIYO_KEY) {
  const metricsRes = await kGet('/metrics/', KLAVIYO_KEY)
  const metrics    = metricsRes.data || []
  const find = name => metrics.find(m =>
    m.attributes.name.toLowerCase().includes(name.toLowerCase())
  )?.id

  const metricMap = {
    placedOrder:   find('Placed Order'),
    openedEmail:   find('Opened Email'),
    clickedEmail:  find('Clicked Email'),
    receivedEmail: find('Received Email'),
    clickedSms:    find('Clicked SMS'),
    receivedSms:   find('Received SMS'),
    abandonedCart: find('Started Checkout'),
  }

  const now    = new Date()
  const start7 = new Date(now); start7.setDate(start7.getDate() - 7)
  const start1 = new Date(now); start1.setDate(start1.getDate() - 1)
  const filter7 = [`greater-or-equal(datetime,${iso(start7)})`, `less-than(datetime,${iso(now)})`]
  const filter1 = [`greater-or-equal(datetime,${iso(start1)})`, `less-than(datetime,${iso(now)})`]

  const agg = (metricId, measurements, filterArr) => {
    if (!metricId) return Promise.resolve(null)
    return kPost('/metric-aggregates/', {
      data: { type: 'metric-aggregate', attributes: {
        metric_id: metricId, measurements, interval: 'day', filter: filterArr, page_size: 10,
      }},
    }, KLAVIYO_KEY)
  }

  const [orders1d, ordersRev1d, clickedEmail7d, receivedEmail7d,
         clickedSms7d, receivedSms7d, cartStarted7d] = await Promise.allSettled([
    agg(metricMap.placedOrder,   ['count'],     filter1),
    agg(metricMap.placedOrder,   ['sum_value'], filter1),
    agg(metricMap.clickedEmail,  ['count'],     filter7),
    agg(metricMap.receivedEmail, ['count'],     filter7),
    agg(metricMap.clickedSms,    ['count'],     filter7),
    agg(metricMap.receivedSms,   ['count'],     filter7),
    agg(metricMap.abandonedCart, ['count'],     filter7),
  ])

  const val = r => r.status === 'fulfilled' ? r.value : null

  const ordersToday   = sumResults(val(orders1d), 'count')
  const revenueToday  = sumResults(val(ordersRev1d), 'sum_value')
  const emailClicks   = sumResults(val(clickedEmail7d), 'count')
  const emailReceived = sumResults(val(receivedEmail7d), 'count')
  const smsClicks     = sumResults(val(clickedSms7d), 'count')
  const smsReceived   = sumResults(val(receivedSms7d), 'count')

  return {
    metricMap,
    kpis: {
      revenueToday:   `$${revenueToday.toFixed(0)}`,
      ordersToday:    `${ordersToday}`,
      emailClickRate: emailReceived > 0 ? `${((emailClicks / emailReceived) * 100).toFixed(1)}%` : '—',
      smsClickRate:   smsReceived   > 0 ? `${((smsClicks   / smsReceived)   * 100).toFixed(1)}%` : '—',
      cartAbandoned:  `${sumResults(val(cartStarted7d), 'count')} started`,
    },
  }
}

export async function onRequest(context) {
  const { request, env, params } = context
  const path   = '/' + (params.path || []).join('/')
  const method = request.method
  const KEY    = env.KLAVIYO_KEY

  const json = (data, status = 200) => new Response(JSON.stringify(data), {
    status, headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })

  if (method === 'OPTIONS') return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,DELETE', 'Access-Control-Allow-Headers': 'Content-Type' } })

  try {
    // ── Klaviyo ────────────────────────────────────────────────────────────────
    if (path === '/klaviyo/metrics') {
      return json(await kGet('/metrics/', KEY))
    }
    if (path === '/klaviyo/kpis') {
      return json(await handleKpis(KEY))
    }
    if (path === '/klaviyo/campaigns') {
      return json(await kGet('/campaigns/?filter=equals(messages.channel,%27email%27)&sort=-created_at', KEY))
    }
    if (path === '/klaviyo/flows') {
      return json(await kGet('/flows/?sort=-created', KEY))
    }
    if (path === '/klaviyo/lists') {
      return json(await kGet('/lists/', KEY))
    }

    return json({ error: 'Not found' }, 404)
  } catch (e) {
    return json({ error: e.message }, 500)
  }
}
