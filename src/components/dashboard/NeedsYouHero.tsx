import { AlertCircle } from 'lucide-react'
import type { Rock } from '../../types/database'
import type { TeamTask } from '../../types/database'

interface Props {
  rocks: Rock[]
  teamTasks: TeamTask[]
  userId: string
  userName: string
}

export function NeedsYouHero({ rocks, teamTasks, userId, userName }: Props) {
  const offTrackRocks = rocks.filter(r => r.status === 'off-track')
  const myOpenTeamTasks = teamTasks.filter(
    t => t.assigned_to === userId && t.status !== 'done'
  )

  const totalItems = offTrackRocks.length + myOpenTeamTasks.length

  return (
    <div
      className="needs-you-gradient rounded-[14px] p-6 text-white mb-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle size={16} className="text-blue-300" />
            <span className="text-blue-300 text-xs font-medium uppercase tracking-wider">
              Needs You
            </span>
          </div>
          <h2
            className="text-xl font-bold mb-1"
            style={{ fontFamily: 'Archivo, sans-serif' }}
          >
            Good morning, {userName.split(' ')[0]}
          </h2>
          <p className="text-blue-200 text-sm">
            {totalItems === 0
              ? "You're all caught up — great work."
              : `You have ${totalItems} item${totalItems > 1 ? 's' : ''} that need${totalItems === 1 ? 's' : ''} your attention.`}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div
            className="text-4xl font-bold"
            style={{ fontFamily: 'Archivo, sans-serif' }}
          >
            {totalItems}
          </div>
          <div className="text-blue-300 text-xs mt-1">open items</div>
        </div>
      </div>

      {totalItems > 0 && (
        <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-2 gap-3">
          {offTrackRocks.length > 0 && (
            <div className="bg-white/10 rounded-xl px-4 py-3">
              <div className="text-2xl font-bold" style={{ fontFamily: 'Archivo, sans-serif' }}>
                {offTrackRocks.length}
              </div>
              <div className="text-blue-200 text-xs mt-0.5">Off-track rock{offTrackRocks.length > 1 ? 's' : ''}</div>
            </div>
          )}
          {myOpenTeamTasks.length > 0 && (
            <div className="bg-white/10 rounded-xl px-4 py-3">
              <div className="text-2xl font-bold" style={{ fontFamily: 'Archivo, sans-serif' }}>
                {myOpenTeamTasks.length}
              </div>
              <div className="text-blue-200 text-xs mt-0.5">Team task{myOpenTeamTasks.length > 1 ? 's' : ''} assigned</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
