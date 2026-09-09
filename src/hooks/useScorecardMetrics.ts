import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ScorecardMetric, MetricKey } from '../types/database'

export type { MetricKey, ScorecardMetric }

export function useScorecardMetrics(year: number, loggedInUserId: string) {
  const [metrics, setMetrics] = useState<ScorecardMetric[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMetrics()
  }, [year])

  async function fetchMetrics() {
    setLoading(true)
    const { data } = await supabase
      .from('scorecard_metrics')
      .select('*')
      .eq('year', year)
    setMetrics((data as ScorecardMetric[]) ?? [])
    setLoading(false)
  }

  async function updateMetric(key: MetricKey, field: 'actual' | 'target', value: number | null) {
    const existing = metrics.find(m => m.metric_key === key)
    const row = {
      year,
      metric_key: key,
      actual: field === 'actual' ? value : (existing?.actual ?? null),
      target: field === 'target' ? value : (existing?.target ?? null),
      updated_by: loggedInUserId,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('scorecard_metrics')
      .upsert(row, { onConflict: 'year,metric_key' })
      .select()
      .single()

    if (!error && data) {
      const updated = data as ScorecardMetric
      setMetrics(m => {
        const exists = m.some(x => x.metric_key === key)
        return exists
          ? m.map(x => x.metric_key === key ? updated : x)
          : [...m, updated]
      })
    }
  }

  return { metrics, loading, updateMetric, refetch: fetchMetrics }
}
