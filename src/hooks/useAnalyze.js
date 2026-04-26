import { useState, useCallback, useRef } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function normalizeRiskLevel(level) {
  switch (level) {
    case 'severe':
      return 'act_now'
    case 'high':
    case 'moderate':
      return 'watch'
    case 'low':
      return 'normal'
    case 'unknown':
      return 'unknown'
    default:
      return 'unknown'
  }
}

function scoreSignalLevel(pct) {
  if (pct == null) return 'unknown'
  if (pct < 50) return 'act_now'
  if (pct < 80) return 'watch'
  return 'normal'
}

function toSignal(dataset) {
  const current = dataset?.mean_30d ?? dataset?.latest ?? null
  const historicalMean = dataset?.mean_window ?? null
  const pctOfNormal =
    current != null && historicalMean != null && historicalMean !== 0
      ? (current / historicalMean) * 100
      : null

  return {
    current,
    historical_mean: historicalMean,
    pct_of_normal: pctOfNormal,
    level: scoreSignalLevel(pctOfNormal),
    trend: dataset?.trend ?? 'unknown',
    sample_count: dataset?.sample_count ?? 0,
  }
}

function normalizeResponse(payload) {
  if (!payload) return null

  if (payload.alert_level && payload.signals) {
    return payload
  }

  const advice = payload.advice ?? {}
  const recommendations = advice.recommendations ?? []
  const summary = advice.summary ?? 'No explanation available.'

  return {
    alert_level: normalizeRiskLevel(advice.risk_level),
    signals: {
      soil_moisture: toSignal(payload.data?.soil_moisture),
      rainfall: toSignal(payload.data?.rainfall),
      ndvi: toSignal(payload.data?.ndvi),
    },
    english_explanation: summary,
    dari_explanation: summary,
    english_actions: recommendations,
    dari_actions: recommendations,
    raw: payload,
  }
}

export function useAnalyze() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const abortRef = useRef(null)

  const analyze = useCallback(async ({ lat, lon, crop }) => {
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    const timeout = setTimeout(() => controller.abort(), 60000)

    try {
      const res = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: parseFloat(lat), lon: parseFloat(lon), crop }),
        signal: controller.signal,
      })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const json = await res.json()
      setData(normalizeResponse(json))
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Request timed out after 60 seconds. Try again or load demo data.')
      } else {
        setError(err.message || 'Could not reach the server.')
      }
    } finally {
      clearTimeout(timeout)
      setLoading(false)
    }
  }, [])

  const loadDemo = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/demo`)
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const json = await res.json()
      setData(normalizeResponse(json))
    } catch (err) {
      setError(err.message || 'Could not reach the server.')
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, loading, error, analyze, loadDemo }
}
