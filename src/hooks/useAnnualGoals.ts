import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { AnnualGoal, GoalStatus } from '../types/database'

export function useAnnualGoals(year: number, loggedInUserId: string) {
  const [goals, setGoals] = useState<AnnualGoal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGoals()
  }, [year])

  async function fetchGoals() {
    setLoading(true)
    const { data } = await supabase
      .from('annual_goals')
      .select('*, owner:profiles!owner_id(*), creator:profiles!created_by(*)')
      .eq('year', year)
      .order('created_at', { ascending: true })
    setGoals((data as AnnualGoal[]) ?? [])
    setLoading(false)
  }

  async function addGoal(title: string, description?: string, ownerId?: string) {
    const { data, error } = await supabase
      .from('annual_goals')
      .insert({
        title,
        description: description ?? null,
        status: 'not-started' as GoalStatus,
        year,
        owner_id: ownerId ?? null,
        created_by: loggedInUserId,
      })
      .select('*, owner:profiles!owner_id(*), creator:profiles!created_by(*)')
      .single()
    if (!error && data) setGoals(g => [...g, data as AnnualGoal])
  }

  async function updateGoalStatus(id: string, status: GoalStatus) {
    await supabase.from('annual_goals').update({ status }).eq('id', id)
    setGoals(g => g.map(goal => goal.id === id ? { ...goal, status } : goal))
  }

  async function updateGoal(id: string, updates: { title?: string; description?: string | null; owner_id?: string | null }) {
    await supabase.from('annual_goals').update(updates).eq('id', id)
    setGoals(g => g.map(goal => goal.id === id ? { ...goal, ...updates } : goal))
  }

  async function deleteGoal(id: string) {
    await supabase.from('annual_goals').delete().eq('id', id)
    setGoals(g => g.filter(goal => goal.id !== id))
  }

  return { goals, loading, addGoal, updateGoalStatus, updateGoal, deleteGoal, refetch: fetchGoals }
}
