import { useState, useRef } from 'react'
import { Target, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useAnnualGoals } from '../hooks/useAnnualGoals'
import { useScorecardMetrics } from '../hooks/useScorecardMetrics'
import type { GoalStatus, Profile } from '../types/database'
import type { MetricKey, ScorecardMetric } from '../hooks/useScorecardMetrics'

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

function goalPillClass(status: GoalStatus) {
  return status === 'done' ? 'goal-done' : status
}

// SVG Icons for metrics
function StudentsIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function SchoolsIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21V9l9-6 9 6v12" />
      <rect x="8" y="15" width="8" height="6" />
      <rect x="10" y="10" width="4" height="5" />
    </svg>
  )
}

function DollarsIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
}

type MetricConfig = {
  label: string
  icon: React.ReactNode
  format: (v: number) => string
  inputPrefix?: string
}

const METRIC_CONFIG: Record<MetricKey, MetricConfig> = {
  students: {
    label: 'Students Enrolled',
    icon: <StudentsIcon />,
    format: (v) => v.toLocaleString(),
  },
  schools: {
    label: 'Schools Partnered',
    icon: <SchoolsIcon />,
    format: (v) => v.toLocaleString(),
  },
  dollars_raised: {
    label: 'Dollars Raised',
    icon: <DollarsIcon />,
    format: (v) =>
      '$' + v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
    inputPrefix: '$',
  },
}

const METRIC_ORDER: MetricKey[] = ['students', 'schools', 'dollars_raised']

interface MetricCardProps {
  metricKey: MetricKey
  metric: ScorecardMetric | undefined
  onUpdate: (key: MetricKey, field: 'actual' | 'target', value: number | null) => void
}

function MetricCard({ metricKey, metric, onUpdate }: MetricCardProps) {
  const [editingField, setEditingField] = useState<'actual' | 'target' | null>(null)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const config = METRIC_CONFIG[metricKey]

  const actual = metric?.actual ?? 0
  const target = metric?.target ?? 0
  const pct = target > 0 ? Math.min((actual / target) * 100, 100) : 0
  const pctDisplay = target > 0 ? Math.round((actual / target) * 100) : 0

  function startEdit(field: 'actual' | 'target') {
    setEditingField(field)
    const val = field === 'actual' ? metric?.actual : metric?.target
    setEditValue(val != null ? String(val) : '')
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function commitEdit() {
    if (editingField === null) return
    const trimmed = editValue.trim().replace(/[,$]/g, '')
    const num = trimmed === '' ? null : parseFloat(trimmed)
    if (trimmed !== '' && (isNaN(num!) || num! < 0)) {
      setEditingField(null)
      return
    }
    onUpdate(metricKey, editingField, num)
    setEditingField(null)
  }

  return (
    <div className="card p-6 flex-1 min-w-0 flex flex-col">
      {/* Icon + label */}
      <div className="flex items-center gap-2.5 mb-5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: '#EEF2F7', color: '#2563EB' }}
        >
          {config.icon}
        </div>
        <span className="text-sm font-semibold text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>
          {config.label}
        </span>
      </div>

      {/* Actual value (large, editable) */}
      <div className="mb-1">
        {editingField === 'actual' ? (
          <div className="flex items-center gap-1">
            {config.inputPrefix && (
              <span className="text-2xl font-bold" style={{ color: '#0B1E39', fontFamily: 'Archivo, sans-serif' }}>
                {config.inputPrefix}
              </span>
            )}
            <input
              ref={inputRef}
              type="number"
              min="0"
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={e => {
                if (e.key === 'Enter') commitEdit()
                if (e.key === 'Escape') setEditingField(null)
              }}
              className="text-3xl font-bold border-b-2 outline-none w-full bg-transparent"
              style={{
                borderColor: '#2563EB',
                color: '#0B1E39',
                fontFamily: 'Archivo, sans-serif',
              }}
            />
          </div>
        ) : (
          <button
            onClick={() => startEdit('actual')}
            title="Click to edit"
            className="text-3xl font-bold text-left hover:opacity-70 transition-opacity cursor-text"
            style={{ color: '#0B1E39', fontFamily: 'Archivo, sans-serif' }}
          >
            {config.format(actual)}
          </button>
        )}
      </div>

      {/* Target */}
      <div className="flex items-center gap-1.5 mb-5">
        <span className="text-xs text-gray-400">of</span>
        {editingField === 'target' ? (
          <div className="flex items-center gap-0.5">
            {config.inputPrefix && (
              <span className="text-xs font-medium" style={{ color: '#2563EB' }}>
                {config.inputPrefix}
              </span>
            )}
            <input
              ref={editingField === 'target' ? inputRef : undefined}
              type="number"
              min="0"
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={e => {
                if (e.key === 'Enter') commitEdit()
                if (e.key === 'Escape') setEditingField(null)
              }}
              className="text-xs border-b outline-none w-24 bg-transparent"
              style={{ borderColor: '#2563EB', color: '#2563EB' }}
            />
          </div>
        ) : (
          <button
            onClick={() => startEdit('target')}
            title="Click to set target"
            className="text-xs font-medium hover:opacity-70 transition-opacity cursor-text"
            style={{ color: '#2563EB' }}
          >
            {target > 0 ? config.format(target) : 'set target'}
          </button>
        )}
        <span className="text-xs text-gray-400">target</span>
      </div>

      {/* Progress bar */}
      <div className="mt-auto">
        <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: '#E5E7EB' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: '#2563EB' }}
          />
        </div>
        <p
          className="text-xs font-medium"
          style={{ color: pctDisplay >= 100 ? '#16a34a' : '#6B7280' }}
        >
          {pctDisplay}% of target
        </p>
      </div>
    </div>
  )
}

export function AnnualGoals({ loggedInUserId, profiles }: Props) {
  const [year, setYear] = useState(CURRENT_YEAR)
  const { goals, loading: goalsLoading, addGoal, updateGoalStatus, deleteGoal } = useAnnualGoals(year, loggedInUserId)
  const { metrics, loading: metricsLoading, updateMetric } = useScorecardMetrics(year, loggedInUserId)

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
      <div className="max-w-3xl mx-auto space-y-8">

        {/* ── Section 1: Annual Goals ─────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-5">
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
            <div className="card p-5 mb-4 border border-blue-100">
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

          {/* Goals list — compact scorecard rows */}
          {goalsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="card h-14 animate-pulse bg-gray-100" />
              ))}
            </div>
          ) : goals.length === 0 ? (
            <div className="card p-10 text-center">
              <Target size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-400 font-medium">No goals for {year} yet</p>
              <p className="text-xs text-gray-300 mt-1">Add the team's annual goals above</p>
            </div>
          ) : (
            <div className="space-y-2">
              {goals.map(goal => {
                const expanded = expandedId === goal.id
                const ownerName = goal.owner?.full_name ?? goal.owner?.email?.split('@')[0] ?? null
                const isCreator = goal.created_by === loggedInUserId
                return (
                  <div key={goal.id} className="card px-4 py-3 group">
                    <div className="flex items-center gap-3">
                      <p className="flex-1 text-sm font-medium text-gray-900 leading-snug truncate">
                        {goal.title}
                      </p>

                      <div className="flex items-center gap-2 shrink-0">
                        {ownerName && (
                          <span
                            className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                            style={{ background: '#EEF2F7', color: '#374151' }}
                          >
                            {ownerName}
                          </span>
                        )}

                        <select
                          value={goal.status}
                          onChange={e => updateGoalStatus(goal.id, e.target.value as GoalStatus)}
                          className={`status-pill ${goalPillClass(goal.status)} cursor-pointer outline-none border-none bg-transparent text-xs font-medium`}
                        >
                          {STATUS_OPTIONS.map(s => (
                            <option key={s.value} value={s.value} className="text-gray-800 bg-white">
                              {s.label}
                            </option>
                          ))}
                        </select>

                        {goal.description && (
                          <button
                            onClick={() => setExpandedId(expanded ? null : goal.id)}
                            className="text-gray-300 hover:text-gray-500 transition-colors"
                          >
                            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        )}

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

                    {goal.description && expanded && (
                      <p className="text-xs text-gray-500 mt-2 leading-relaxed ml-0">
                        {goal.description}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Section 2: Key Metrics Scorecard ────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Archivo, sans-serif' }}>
              Key Metrics — {year}
            </h2>
          </div>

          {metricsLoading ? (
            <div className="flex gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="card h-48 flex-1 animate-pulse bg-gray-100" />
              ))}
            </div>
          ) : (
            <div className="flex gap-4">
              {METRIC_ORDER.map(key => (
                <MetricCard
                  key={key}
                  metricKey={key}
                  metric={metrics.find(m => m.metric_key === key)}
                  onUpdate={updateMetric}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
