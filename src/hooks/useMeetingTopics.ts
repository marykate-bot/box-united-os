import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { MeetingTopic } from '../types/database'

export type { MeetingTopic }

export function useMeetingTopics() {
  const [topics, setTopics] = useState<MeetingTopic[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTopics()
  }, [])

  async function fetchTopics() {
    setLoading(true)
    const { data } = await supabase
      .from('meeting_topics')
      .select('*, adder:profiles!added_by(*)')
      .order('done', { ascending: true })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
    setTopics((data as MeetingTopic[]) ?? [])
    setLoading(false)
  }

  async function addTopic(text: string, addedBy: string | null) {
    const maxOrder = topics.length > 0 ? Math.max(...topics.map(t => t.sort_order)) + 1 : 0
    const { data, error } = await supabase
      .from('meeting_topics')
      .insert({
        text,
        added_by: addedBy ?? null,
        done: false,
        sort_order: maxOrder,
      })
      .select('*, adder:profiles!added_by(*)')
      .single()

    if (!error && data) {
      setTopics(t => [...t, data as MeetingTopic])
    }
  }

  async function toggleDone(id: string, done: boolean) {
    await supabase.from('meeting_topics').update({ done }).eq('id', id)
    setTopics(t => {
      const updated = t.map(topic => topic.id === id ? { ...topic, done } : topic)
      return [...updated].sort((a, b) => {
        if (a.done === b.done) return a.sort_order - b.sort_order
        return a.done ? 1 : -1
      })
    })
  }

  async function deleteTopic(id: string) {
    await supabase.from('meeting_topics').delete().eq('id', id)
    setTopics(t => t.filter(topic => topic.id !== id))
  }

  async function clearCovered() {
    const doneIds = topics.filter(t => t.done).map(t => t.id)
    if (doneIds.length === 0) return
    await supabase.from('meeting_topics').delete().in('id', doneIds)
    setTopics(t => t.filter(topic => !topic.done))
  }

  return { topics, loading, addTopic, toggleDone, deleteTopic, clearCovered, refetch: fetchTopics }
}
