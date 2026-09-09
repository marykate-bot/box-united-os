import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useMeetingTopics } from '../hooks/useMeetingTopics'
import type { Profile } from '../types/database'

interface Props {
  loggedInUserId: string
  profiles: Profile[]
}

export function TeamMeeting({ loggedInUserId, profiles }: Props) {
  const { topics, loading, addTopic, toggleDone, deleteTopic, clearCovered } = useMeetingTopics()

  const [newText, setNewText] = useState('')
  const [newAddedBy, setNewAddedBy] = useState(loggedInUserId)
  const [adding, setAdding] = useState(false)

  const hasDone = topics.some(t => t.done)
  const pending = topics.filter(t => !t.done)
  const covered = topics.filter(t => t.done)

  async function handleAdd() {
    if (!newText.trim()) return
    setAdding(true)
    await addTopic(newText.trim(), newAddedBy || null)
    setNewText('')
    setAdding(false)
  }

  return (
    <div className="flex-1 overflow-auto p-8" style={{ background: '#EEF2F7' }}>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Archivo, sans-serif' }}>
                Team meeting topics
              </h1>
            </div>
            <p className="text-sm text-gray-400 ml-7">Add topics before your next meeting</p>
          </div>

          {hasDone && (
            <button
              onClick={clearCovered}
              className="text-sm font-medium px-4 py-2 rounded-xl border transition-colors hover:bg-gray-50"
              style={{ borderColor: '#D1D5DB', color: '#6B7280' }}
            >
              Clear covered
            </button>
          )}
        </div>

        {/* Topic checklist */}
        {loading ? (
          <div className="space-y-2 mb-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="card h-16 animate-pulse bg-gray-100" />
            ))}
          </div>
        ) : topics.length === 0 ? (
          <div className="card p-10 text-center mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p className="text-sm text-gray-400 font-medium">Nothing queued yet.</p>
            <p className="text-xs text-gray-300 mt-1">Add topics below to prepare for your next meeting</p>
          </div>
        ) : (
          <div className="space-y-2 mb-4">
            {/* Pending topics */}
            {pending.map(topic => {
              const adderName = topic.adder?.full_name ?? topic.adder?.email?.split('@')[0] ?? null
              return (
                <div key={topic.id} className="card px-4 py-3.5 group flex items-start gap-3">
                  <button
                    onClick={() => toggleDone(topic.id, !topic.done)}
                    className="mt-0.5 shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all"
                    style={{ borderColor: '#D1D5DB', background: 'transparent' }}
                  >
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 leading-snug">{topic.text}</p>
                    {adderName && (
                      <p className="text-xs text-gray-400 mt-0.5">added by {adderName}</p>
                    )}
                  </div>

                  <button
                    onClick={() => deleteTopic(topic.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all shrink-0 mt-0.5"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )
            })}

            {/* Covered topics */}
            {covered.length > 0 && pending.length > 0 && (
              <div className="border-t border-gray-200 my-3" />
            )}
            {covered.map(topic => {
              const adderName = topic.adder?.full_name ?? topic.adder?.email?.split('@')[0] ?? null
              return (
                <div
                  key={topic.id}
                  className="card px-4 py-3.5 group flex items-start gap-3"
                  style={{ opacity: 0.5 }}
                >
                  <button
                    onClick={() => toggleDone(topic.id, !topic.done)}
                    className="mt-0.5 shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all"
                    style={{ borderColor: '#2563EB', background: '#2563EB' }}
                  >
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug text-gray-400 line-through">{topic.text}</p>
                    {adderName && (
                      <p className="text-xs text-gray-300 mt-0.5">added by {adderName}</p>
                    )}
                  </div>

                  <button
                    onClick={() => deleteTopic(topic.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all shrink-0 mt-0.5"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Add topic form */}
        <div className="card p-4">
          <div className="flex gap-3 items-center flex-wrap">
            <input
              type="text"
              placeholder="New topic…"
              value={newText}
              onChange={e => setNewText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAdd()}
              className="flex-1 text-sm text-gray-800 placeholder-gray-400 outline-none border border-gray-200 rounded-lg px-3 py-2 min-w-[180px]"
            />
            <select
              value={newAddedBy}
              onChange={e => setNewAddedBy(e.target.value)}
              className="text-sm text-gray-700 outline-none border border-gray-200 rounded-lg px-3 py-2 bg-white"
            >
              <option value="">No one</option>
              {profiles.map(p => (
                <option key={p.id} value={p.id}>
                  {p.full_name ?? p.email}
                  {p.id === loggedInUserId ? ' (me)' : ''}
                </option>
              ))}
            </select>
            <button
              onClick={handleAdd}
              disabled={!newText.trim() || adding}
              className="flex items-center gap-1.5 text-sm font-medium text-white px-4 py-2 rounded-lg disabled:opacity-40 transition-opacity hover:opacity-90"
              style={{ background: '#2563EB' }}
            >
              <Plus size={15} />
              Add
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
