import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Rock, RockStatus } from '../types/database'

export function useRocks(userId: string) {
  const [rocks, setRocks] = useState<Rock[]>([])
  const [loading, setLoading] = useState(true)

  const currentQuarter = (() => {
    const now = new Date()
    const q = Math.ceil((now.getMonth() + 1) / 3)
    return `Q${q} ${now.getFullYear()}`
  })()

  useEffect(() => {
    if (!userId) return
    fetch()
  }, [userId])

  async function fetch() {
    setLoading(true)
    const { data } = await supabase
      .from('rocks')
      .select('*, profiles(*)')
      .eq('user_id', userId)
      .eq('quarter', currentQuarter)
      .order('created_at', { ascending: true })
    setRocks(data ?? [])
    setLoading(false)
  }

  async function addRock(title: string, description?: string) {
    if (rocks.length >= 3) return
    const { data, error } = await supabase
      .from('rocks')
      .insert({ user_id: userId, title, description: description ?? null, status: 'on-track', quarter: currentQuarter })
      .select('*, profiles(*)')
      .single()
    if (!error && data) setRocks(r => [...r, data])
  }

  async function updateRockStatus(id: string, status: RockStatus) {
    await supabase.from('rocks').update({ status }).eq('id', id)
    setRocks(r => r.map(rock => rock.id === id ? { ...rock, status } : rock))
  }

  async function deleteRock(id: string) {
    await supabase.from('rocks').delete().eq('id', id)
    setRocks(r => r.filter(rock => rock.id !== id))
  }

  return { rocks, loading, currentQuarter, addRock, updateRockStatus, deleteRock, refetch: fetch }
}
