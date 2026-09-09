import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Decision } from '../types/database'

export type { Decision }

export function useDecisions(loggedInUserId: string) {
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDecisions()
  }, [])

  async function fetchDecisions() {
    setLoading(true)
    const { data } = await supabase
      .from('decisions')
      .select('*, decider:profiles!decided_by(*)')
      .order('decided_at', { ascending: false })
      .order('created_at', { ascending: false })
    setDecisions((data as Decision[]) ?? [])
    setLoading(false)
  }

  async function addDecision(
    title: string,
    context: string | null,
    decidedBy: string | null,
    decidedAt: string,
  ) {
    const { data, error } = await supabase
      .from('decisions')
      .insert({
        title,
        context: context ?? null,
        decided_by: decidedBy ?? null,
        decided_at: decidedAt,
        created_by: loggedInUserId,
      })
      .select('*, decider:profiles!decided_by(*)')
      .single()

    if (!error && data) {
      setDecisions(d => [data as Decision, ...d])
    }
  }

  async function deleteDecision(id: string) {
    await supabase.from('decisions').delete().eq('id', id)
    setDecisions(d => d.filter(dec => dec.id !== id))
  }

  return { decisions, loading, addDecision, deleteDecision, refetch: fetchDecisions }
}
