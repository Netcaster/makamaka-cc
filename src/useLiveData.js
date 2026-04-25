import { useState, useCallback } from 'react'

async function get(url) {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`${r.status} ${url}`)
  return r.json()
}

export function useLiveData() {
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [lastSync, setLastSync] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [kpis, campaigns, flows, lists, bufferWebhook] =
        await Promise.allSettled([
          get('/api/klaviyo/kpis'),
          get('/api/klaviyo/campaigns'),
          get('/api/klaviyo/flows'),
          get('/api/klaviyo/lists'),
          get('/api/webhook/buffer'),
        ])

      const val = r => r.status === 'fulfilled' ? r.value : null

      setData({
        kpis:          val(kpis),
        campaigns:     val(campaigns),
        flows:         val(flows),
        lists:         val(lists),
        bufferPosts:   val(bufferWebhook)?.posts || [],
      })
      setLastSync(
        new Date().toLocaleTimeString('en-US', {
          timeZone: 'Pacific/Honolulu', hour: '2-digit', minute: '2-digit',
        }) + ' HST'
      )
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, loading, error, lastSync, refresh }
}
