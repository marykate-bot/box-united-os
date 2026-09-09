import { useState } from 'react'
import { Plus, Target } from 'lucide-react'
import type { Rock, RockStatus } from '../../types/database'

interface Props {
  rocks: Rock[]
  currentQuarter: string
  onAdd: (title: string, description?: string) => void
  onUpdateStatus: (id: string, status: RockStatus) => void
  onDelete: (id: string) => void
  loading: boolean
  readOnly?: boolean
}

const STATUS_LABELS: Record<RockStatus, string> = {
  'on-track': 'On Track',
  'off-track': 'Off Track',
  'done': 'Done',
}

const STATUS_OPTIONS: RockStatus[] = ['on-track', 'off-track', 'done']

export function RocksBoard({ rocks, currentQuarter, onAdd, onUpdateStatus, onDelete, loading, readOnly = false }: Props) {
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const canAdd = !readOnly && rocks.length < 3

  function handleAdd() {
    if (!newTitle.trim()) return
    onAdd(newTitle.trim(), newDesc.trim() || undefined)
    setNewTitle('')
    setNewDesc('')
    setShowAdd(false)
  }

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target size={16} className="text-blue-600" />
          <h3 className="font-semibold text-gray-900 text-sm" style={{ fontFamily: 'Archivo, sans-serif' }}>
            Quarterly Rocks
          </h3>
          <span className="text-xs text-gray-400 font-normal ml-1">{currentQuarter}</span>
          <span className="text-xs text-gray-400">({rocks.length}/3)</span>
        </div>
        {canAdd && (
          <button
            onClick={() => setShowAdd(v => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            <Plus size={14} />
            Add rock
          </button>
        )}
      </div>

      {showAdd && (
        <div className="card p-4 mb-3 border border-blue-100">
          <input
            autoFocus
            type="text"
            placeholder="Rock title…"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="w-full text-sm text-gray-800 placeholder-gray-400 outline-none mb-2 border-b border-gray-200 pb-2"
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            className="w-full text-sm text-gray-500 placeholder-gray-400 outline-none mb-3"
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAdd(false)} className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5">
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!newTitle.trim()}
              className="text-xs font-medium text-white px-4 py-1.5 rounded-lg disabled:opacity-40 transition-colors"
              style={{ background: '#2563EB' }}
            >
              Save Rock
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card h-20 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : rocks.length === 0 ? (
        <div className="card p-8 text-center">
          <Target size={28} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">No rocks yet for {currentQuarter}</p>
          <p className="text-xs text-gray-300 mt-1">Add up to 3 quarterly goals above</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rocks.map(rock => (
            <div key={rock.id} className="card p-4 group">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 leading-snug">{rock.title}</p>
                  {rock.description && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{rock.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {readOnly ? (
                    <span className={`status-pill ${rock.status} text-xs font-medium`}>
                      {STATUS_LABELS[rock.status]}
                    </span>
                  ) : (
                    <select
                      value={rock.status}
                      onChange={e => onUpdateStatus(rock.id, e.target.value as RockStatus)}
                      className={`status-pill ${rock.status} cursor-pointer outline-none border-none bg-transparent text-xs font-medium`}
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s} className="text-gray-800 bg-white">
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  )}
                  {!readOnly && (
                    <button
                      onClick={() => onDelete(rock.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
