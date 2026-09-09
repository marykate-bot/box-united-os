import { useState } from 'react'
import { Target, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useAnnualGoals } from '../hooks/useAnnualGoals'
import type { GoalStatus, Profile } from '../types/database'

interface Props {
  loggedInUserId: string
  profiles: Profile[]
}

const CURRENT_YEAR = new Date().getFullYear()

const STATUS_OPTIONS: { value: GoalStatus; label: string; pillClass: string }[] = [
  { value: 'not-started', label: 'Not Started', pillClass: 'not-started' },
  { value: 'in-progress', label: 'In Progress', pillClass: 'in-progress' },
  { value: 'on-track',    label: 'On Track',    pillClass: 'on-track' },
  { value: 'done',        label: 'Done',        pillClass: 'goal-done' },
]

function pillClass(status: GoalStatus) {
  return status === 'done' ? 'goal-done' : status
}

export function AnnualGoals({ loggedInUserId, profiles }: Props) {
  const [year, setYear] = useState(CURRENT_YEAR)
  const { goals, loading, addGoal, updateGoalStatus, deleteGoal } = useAnnualGoals(year, loggedInUserId)
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newOwner, setNewOwner] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const years = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1]

  function handleAdd() {
    if (!newTitle.trim()) return
    addGoal(newTitle.trim(), newDesc.trim() || undefined, newOwner || undefined)
    setNewTitle('')
    setNewDesc('')
    setNewOwner('')
    setShowAdd(false)
  }

  return (
    <div className="flex-1 overflow-auto p-8" style={{ background: '#EEF2F7' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Target size={18} className="text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Archivo, sans-serif' }}>
                Annual Goals
              </h1>
            </div>
            <p className="text-sm text-gray-400 ml-7">Shared team goals for the year</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Year picker */}
            <div className="flex items-center gap-1 bg-white rounded-xl px-3 py-2 shadow-sm border border-gray-100">
              {years.map(y => (
                <button
                  key={y}
                  onClick={() => setYear(y)}
                  className="text-xs font-medium px-2.5 py-1 rounded-lg transition-all"
                  style={{
                    background: year === y ? '#2563EB' : 'transparent',
                    color: year === y ? 'white' : '#6b7280',
                  }}
                >
                  {y}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowAdd(v => !v)}
              className="flex items-center gap-2 text-sm font-medium text-white px-4 py-2 rounded-xl transition-colors hover:opacity-90"
              style={{ background: '#2563EB' }}
            >
              <Plus size={15} />
              Add goal
            </button>
          </div>
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="card p-5 mb-5 border border-blue-100">
            <h4 className="text-sm font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Archivo, sans-serif' }}>
              New Annual Goal for {year}
            </h4>
            <div className="space-y-3">
              <input
                autoFocus
                type="text"
                placeholder="Goal title…"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                className="w-full text-sm text-gray-800 placeholder-gray-400 outline-none border border-gray-200 rounded-lg px-3 py-2"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                className="w-full text-sm text-gray-500 placeholder-gray-400 outline-none border border-gray-200 rounded-lg px-3 py-2"
              />
              <select
                value={newOwner}
                onChange={e => setNewOwner(e.target.value)}
                className="w-full text-sm text-gray-700 outline-none border border-gray-200 rounded-lg px-3 py-2 bg-white"
              >
                <option value="">Owner (optional)</option>
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.full_name ?? p.email}
                    {p.id === loggedInUserId ? ' (me)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => setShowAdd(false)}
                className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!newTitle.trim()}
                className="text-xs font-medium text-white px-4 py-1.5 rounded-lg disabled:opacity-40 transition-colors"
                style={{ background: '#2563EB' }}
              >
                Save Goal
              </button>
            </div>
          </div>
        )}

        {/* Goals list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="card h-20 animate-pulse bg-gray-100" />
            ))}
          </div>
        ) : goals.length === 0 ? (
          <div className="card p-10 text-center">
            <Target size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-400 font-medium">No goals for {year} yet</p>
            <p className="text-xs text-gray-300 mt-1">Add the team's annual goals above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map(goal => {
              const expanded = expandedId === goal.id
              const ownerName = goal.owner?.full_name ?? goal.owner?.email?.split('@')[0] ?? null
              const isCreator = goal.created_by === loggedInUserId
              return (
                <div key={goal.id} className="card p-4 group">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 leading-snug">{goal.title}</p>
                      {ownerName && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Owner: <span className="text-gray-600">{ownerName}</span>
                        </p>
                      )}
                      {goal.description && expanded && (
                        <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{goal.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Status pill / selector */}
                      <select
                        value={goal.status}
                        onChange={e => updateGoalStatus(goal.id, e.target.value as GoalStatus)}
                        className={`status-pill ${pillClass(goal.status)} cursor-pointer outline-none border-none bg-transparent text-xs font-medium`}
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s.value} value={s.value} className="text-gray-800 bg-white">
                            {s.label}
                          </option>
                        ))}
                      </select>

                      {/* Expand toggle for description */}
                      {goal.description && (
                        <button
                          onClick={() => setExpandedId(expanded ? null : goal.id)}
                          className="text-gray-300 hover:text-gray-500 transition-colors"
                        >
                          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      )}

                      {/* Delete (only creator can delete) */}
                      {isCreator && (
                        <button
                          onClick={() => deleteGoal(goal.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Summary stats */}
        {!loading && goals.length > 0 && (
          <div className="mt-6 grid grid-cols-4 gap-3">
            {STATUS_OPTIONS.map(s => {
              const count = goals.filter(g => g.status === s.value).length
              return (
                <div key={s.value} className="card p-3 text-center">
                  <div className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Archivo, sans-serif' }}>
                    {count}
                  </div>
                  <div className={`status-pill ${s.pillClass} mt-1.5 justify-center`} style={{ display: 'flex' }}>
                    {s.label}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
