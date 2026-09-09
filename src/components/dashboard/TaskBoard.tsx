import { useState } from 'react'
import { CheckSquare, Square, Plus, Trash2, CheckCheck } from 'lucide-react'
import type { TaskFrequency } from '../../types/database'
import { useTasks } from '../../hooks/useTasks'

interface Props {
  userId: string
  readOnly?: boolean
}

const FREQUENCIES: { id: TaskFrequency; label: string }[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
]

export function TaskBoard({ userId, readOnly = false }: Props) {
  const [frequency, setFrequency] = useState<TaskFrequency>('daily')
  const { tasks, loading, addTask, toggleTask, deleteTask } = useTasks(userId, frequency)
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const done = tasks.filter(t => t.completed)
  const pending = tasks.filter(t => !t.completed)

  function handleAdd() {
    if (!newTitle.trim()) return
    addTask(newTitle.trim())
    setNewTitle('')
    setShowAdd(false)
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CheckSquare size={16} className="text-blue-600" />
          <h3 className="font-semibold text-gray-900 text-sm" style={{ fontFamily: 'Archivo, sans-serif' }}>
            {readOnly ? 'Tasks' : 'My Tasks'}
          </h3>
        </div>
        {!readOnly && (
          <button
            onClick={() => setShowAdd(v => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            <Plus size={14} />
            Add task
          </button>
        )}
      </div>

      {/* Frequency toggle */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg">
        {FREQUENCIES.map(f => (
          <button
            key={f.id}
            onClick={() => setFrequency(f.id)}
            className="flex-1 text-xs font-medium py-1.5 rounded-md transition-all"
            style={{
              background: frequency === f.id ? 'white' : 'transparent',
              color: frequency === f.id ? '#1e293b' : '#6b7280',
              boxShadow: frequency === f.id ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {!readOnly && showAdd && (
        <div className="card p-4 mb-3 border border-blue-100">
          <input
            autoFocus
            type="text"
            placeholder={`New ${frequency} task…`}
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="w-full text-sm text-gray-800 placeholder-gray-400 outline-none mb-3"
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAdd(false)} className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5">
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!newTitle.trim()}
              className="text-xs font-medium text-white px-4 py-1.5 rounded-lg disabled:opacity-40"
              style={{ background: '#2563EB' }}
            >
              Add
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-11 rounded-xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : tasks.length === 0 ? (
        <div className="card p-8 text-center">
          <CheckCheck size={28} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">No {frequency} tasks yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pending.map(task => (
            <div key={task.id} className="card px-4 py-3 flex items-center gap-3 group">
              {readOnly ? (
                <Square size={16} className="shrink-0 text-gray-300" />
              ) : (
                <button onClick={() => toggleTask(task.id, true)} className="shrink-0 text-gray-300 hover:text-blue-500 transition-colors">
                  <Square size={16} />
                </button>
              )}
              <span className="text-sm text-gray-800 flex-1">{task.title}</span>
              {!readOnly && (
                <button
                  onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
          {done.length > 0 && (
            <>
              <div className="text-xs text-gray-400 px-1 pt-2 pb-1 font-medium">Completed</div>
              {done.map(task => (
                <div key={task.id} className="card px-4 py-3 flex items-center gap-3 group opacity-60">
                  {readOnly ? (
                    <CheckSquare size={16} className="shrink-0 text-blue-500" />
                  ) : (
                    <button onClick={() => toggleTask(task.id, false)} className="shrink-0 text-blue-500">
                      <CheckSquare size={16} />
                    </button>
                  )}
                  <span className="text-sm text-gray-500 flex-1 line-through">{task.title}</span>
                  {!readOnly && (
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </section>
  )
}
