import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { TeamTask, TeamTaskStatus, Profile } from '../types/database'

export function useTeamTasks() {
  const [tasks, setTasks] = useState<TeamTask[]>([])
  const [members, setMembers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    const [tasksResult, membersResult] = await Promise.all([
      supabase
        .from('team_tasks')
        .select('*, creator:profiles!team_tasks_created_by_fkey(*), assignee:profiles!team_tasks_assigned_to_fkey(*)')
        .order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('full_name'),
    ])
    setTasks(tasksResult.data ?? [])
    setMembers(membersResult.data ?? [])
    setLoading(false)
  }

  async function addTeamTask(title: string, createdBy: string, assignedTo?: string, description?: string) {
    const { data, error } = await supabase
      .from('team_tasks')
      .insert({
        title,
        created_by: createdBy,
        assigned_to: assignedTo ?? null,
        description: description ?? null,
        status: 'todo',
      })
      .select('*, creator:profiles!team_tasks_created_by_fkey(*), assignee:profiles!team_tasks_assigned_to_fkey(*)')
      .single()
    if (!error && data) setTasks(t => [data, ...t])
  }

  async function updateTaskStatus(id: string, status: TeamTaskStatus) {
    await supabase.from('team_tasks').update({ status }).eq('id', id)
    setTasks(t => t.map(task => task.id === id ? { ...task, status } : task))
  }

  async function assignTask(id: string, assignedTo: string | null) {
    await supabase.from('team_tasks').update({ assigned_to: assignedTo }).eq('id', id)
    setTasks(t => t.map(task => {
      if (task.id !== id) return task
      const assignee = assignedTo ? members.find(m => m.id === assignedTo) : undefined
      return { ...task, assigned_to: assignedTo, assignee }
    }))
  }

  async function deleteTeamTask(id: string) {
    await supabase.from('team_tasks').delete().eq('id', id)
    setTasks(t => t.filter(task => task.id !== id))
  }

  return { tasks, members, loading, addTeamTask, updateTaskStatus, assignTask, deleteTeamTask, refetch: fetchAll }
}
