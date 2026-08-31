import { useState } from 'react'
import { Users, Plus, UserCheck, Trash2 } from 'lucide-react'
import type { TeamTaskStatus } from '../../types/database'
import { useTeamTasks } from '../../hooks/useTeamTasks'

interface Props {
  currentUserId: string
}

const STATUS_COLS: { id: TeamTaskStatus; label: string; color: string }[] = [
  { id: 'todo', label: 'To Do', color: '#eff6ff' },
  { id: 'in-progress', label: 'In Progress', color: '#fef3c7' },
  { id: 'done', label: 'Done', color: '#f0fdf4' },
]

export function TeamBoard({ currentUserId }: Props) {
  const { tasks, members, loading, addTeamTask, updateTaskStatus, assignTask, deleteTeamTask } = useTeamTasks()
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newAssignee, setNewAssignee] = useState('')
  const [newDesc, setNewDesc] = useState('')

  function handleAdd() {
    if (!newTitle.trim()) return
    addTeamTask(
      newTitle.trim(),
      currentUserId,
      newAssignee || undefined,
      newDesc.trim() || undefined,
    )
    setNewTitle('')
    setNewAssignee('')
    setNewDesc('')
    setShowAdd(false)
  }

  return (
    <div className="flex-1 overflow-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Users size={18} className="text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Archivo, sans-serif' }}>
              Team Board
            </h1>
          </div>
          <p className="text-sm text-gray-400 ml-7">Cross-team tasks and assignments</p>
        </div>
        <button
          onClick={() => setShowAdd(v => !v)}
          className="flex items-center gap-2 text-sm font-medium text-white px-4 py-2 rounded-xl transition-colors hover:opacity-90"
          style={{ background: '#2563EB' }}
        >
          <Plus size={15} />
          Add task
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="card p-5 mb-6 border border-blue-100">
          <h4 className="text-sm font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Archivo, sans-serif' }}>
            New Team Task
          </h4>
          <div className="space-y-3">
            <input
              autoFocus
              type="text"
              placeholder="Task title…"
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
              value={newAssignee}
              onChange={e => setNewAssignee(e.target.value)}
              className="w-full text-sm text-gray-700 outline-none border border-gray-200 rounded-lg px-3 py-2 bg-white"
            >
              <option value="">Assign to… (optional)</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>
                  {m.full_name ?? m.email}
                  {m.id === currentUserId ? ' (me)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <button onClick={() => setShowAdd(false)} className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5">
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!newTitle.trim()}
              className="text-xs font-medium text-white px-4 py-1.5 rounded-lg disabled:opacity-40"
              style={{ background: '#2563EB' }}
            >
              Create Task
            </button>
          </div>
        </div>
      )}

      {/* Kanban columns */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {STATUS_COLS.map(col => (
            <div key={col.id} className="rounded-[14px] p-4" style={{ background: col.color }}>
              <div className="h-5 w-20 bg-gray-200 rounded animate-pulse mb-3" />
              <div className="space-y-2">
                {[1, 2].map(i => <div key={i} className="h-20 bg-white/60 rounded-xl animate-pulse" />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STATUS_COLS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.id)
            return (
              <div key={col.id} className="rounded-[14px] p-4" style={{ background: col.color }}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {col.label}
                  </h4>
                  <span className="text-xs text-gray-400 font-medium bg-white/60 px-2 py-0.5 rounded-full">
                    {colTasks.length}
                  </span>
                </div>
                <div className="space-y-2 min-h-[80px]">
                  {colTasks.map(task => (
                    <TeamTaskCard
                      key={task.id}
                      task={task}
                      members={members}
                      currentUserId={currentUserId}
                      onStatusChange={updateTaskStatus}
                      onAssign={assignTask}
                      onDelete={deleteTeamTask}
                    />
                  ))}
                  {colTasks.length === 0 && (
                    <div className="h-12 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center">
                      <span className="text-xs text-gray-300">No tasks</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

interface CardProps {
  task: ReturnType<typeof useTeamTasks>['tasks'][number]
  members: ReturnType<typeof useTeamTasks>['members']
  currentUserId: string
  onStatusChange: (id: string, status: TeamTaskStatus) => void
  onAssign: (id: string, assignedTo: string | null) => void
  onDelete: (id: string) => void
}

function TeamTaskCard({ task, members, currentUserId, onStatusChange, onAssign, onDelete }: CardProps) {
  const assignee = task.assignee
  const isAssignedToMe = task.assigned_to === currentUserId

  return (
    <div className="card p-3 group">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-gray-900 leading-snug flex-1">{task.title}</p>
        <button
          onClick={() => onDelete(task.id)}
          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all shrink-0 mt-0.5"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {task.description && (
        <p className="text-xs text-gray-400 mb-2 leading-relaxed">{task.description}</p>
      )}

      <div className="flex items-center justify-between gap-2">
        {/* Assignee */}
        <div className="flex items-center gap-1">
          {assignee ? (
            <div className="flex items-center gap-1.5">
              {assignee.avatar_url ? (
                <img src={assignee.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: isAssignedToMe ? '#2563EB' : '#6b7280' }}
                >
                  {(assignee.full_name ?? assignee.email)[0]?.toUpperCase()}
                </div>
              )}
              <span className={`text-xs font-medium ${isAssignedToMe ? 'text-blue-600' : 'text-gray-500'}`}>
                {isAssignedToMe ? 'You' : (assignee.full_name ?? assignee.email.split('@')[0])}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-gray-300">
              <UserCheck size={13} />
              <span className="text-xs">Unassigned</span>
            </div>
          )}
        </div>

        {/* Status pill as dropdown */}
        <select
          value={task.status}
          onChange={e => onStatusChange(task.id, e.target.value as TeamTaskStatus)}
          className={`status-pill ${task.status} cursor-pointer outline-none border-none bg-transparent`}
          style={{ appearance: 'none', paddingRight: '4px' }}
        >
          <option value="todo" className="text-gray-800 bg-white">To Do</option>
          <option value="in-progress" className="text-gray-800 bg-white">In Progress</option>
          <option value="done" className="text-gray-800 bg-white">Done</option>
        </select>
      </div>

      {/* Reassign control */}
      <div className="mt-2 pt-2 border-t border-gray-100">
        <select
          value={task.assigned_to ?? ''}
          onChange={e => onAssign(task.id, e.target.value || null)}
          className="w-full text-xs text-gray-400 outline-none border-none bg-transparent cursor-pointer"
        >
          <option value="">Reassign…</option>
          {members.map(m => (
            <option key={m.id} value={m.id}>
              {m.full_name ?? m.email}{m.id === currentUserId ? ' (me)' : ''}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
