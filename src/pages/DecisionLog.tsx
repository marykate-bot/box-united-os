import { useState } from 'react'
import { BookOpen, Plus, Trash2 } from 'lucide-react'
import { useDecisions } from '../hooks/useDecisions'
import type { Profile } from '../types/database'

interface Props {
  loggedInUserId: string
  profiles: Profile[]
}

const CURRENT_DATE = new Date().toISOString().split('T')[0]

export function DecisionLog({ loggedInUserId, profiles }: Props) {
  const { decisions, loading, addDecision, deleteDecision } = useDecisions(loggedInUserId)
  const [showAdd, setShowAdd] = useState(false)
  const [title, setTitle] = useState('')
  const [context, setContext] = useState('')
  const [decidedBy, setDecidedBy] = useState(loggedInUserId)
  const [decidedAt, setDecidedAt] = useState(CURRENT_DATE)
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    if (!title.trim()) return
    setSaving(true)
    await addDecision(title.trim(), context.trim() || null, decidedBy || null, decidedAt)
    setTitle('')
    setContext('')
    setDecidedBy(loggedInUserId)
    setDecidedAt(CURRENT_DATE)
    setShowAdd(false)
    setSaving(false)
  }

  function profileName(id: string | null) {
    if (!id) return 'Team'
    const p = profiles.find(pr => pr.id === id)
    return p?.full_name ?? p?.email ?? 'Team'
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #0B1E39 0%, #2563EB 100%)' }}
          >
            <BookOpen size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Archivo, sans-serif' }}>
              Decision Log
            </h1>
            <p className="text-sm text-gray-500">Key decisions made by the team</p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: '#0B1E39' }}
        >
          <Plus size={15} />
          Log Decision
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
          <h3 className="font-semibold text-gray-800 mb-4">New Decision</h3>
          <div className="space-y-3">
            <input
              autoFocus
              type="text"
              placeholder="Decision title *"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
            <textarea
              placeholder="Context or rationale (optional)"
              value={context}
              onChange={e => setContext(e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none"
            />
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-500 block mb-1">Decided by</label>
                <select
                  value={decidedBy}
                  onChange={e => setDecidedBy(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Team</option>
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name ?? p.email}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Date</label>
                <input
                  type="date"
                  value={decidedAt}
                  onChange={e => setDecidedAt(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!title.trim() || saving}
                className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50"
                style={{ background: '#0B1E39' }}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Loading…</div>
      ) : decisions.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <BookOpen size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No decisions logged yet.</p>
          <p className="text-gray-400 text-xs mt-1">Click "Log Decision" to record your first one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {decisions.map(d => (
            <div key={d.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm leading-snug">{d.title}</p>
                  {d.context && (
                    <p className="text-gray-500 text-sm mt-1 leading-relaxed">{d.context}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>{profileName(d.decided_by)}</span>
                    <span>·</span>
                    <span>{new Date(d.decided_at + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
                {d.created_by === loggedInUserId && (
                  <button
                    onClick={() => deleteDecision(d.id)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
