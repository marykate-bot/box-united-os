import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Task, TaskFrequency } from '../types/database'

export function useTasks(userId: string, frequency: TaskFrequency) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    fetch()
  }, [userId, frequency])

  async function fetch() {
    setLoading(true)
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('frequency', frequency)
      .order('created_at', { ascending: true })
    setTasks(data ?? [])
    setLoading(false)
  }

  async function addTask(title: string, description?: string) {
    const { data, error } = await supabase
      .from('tasks')
      .insert({ user_id: userId, title, description: description ?? null, frequency, completed: false })
      .select()
      .single()
    if (!error && data) setTasks(t => [...t, data])
  }

  async function toggleTask(id: string, completed: boolean) {
    await supabase.from('tasks').update({ completed }).eq('id', id)
    setTasks(t => t.map(task => task.id === id ? { ...task, completed } : task))
  }

  async function deleteTask(id: string) {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(t => t.filter(task => task.id !== id))
  }

  return { tasks, loading, addTask, toggleTask, deleteTask, refetch: fetch }
}
