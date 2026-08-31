import { NeedsYouHero } from '../components/dashboard/NeedsYouHero'
import { RocksBoard } from '../components/dashboard/RocksBoard'
import { TaskBoard } from '../components/dashboard/TaskBoard'
import { useRocks } from '../hooks/useRocks'
import { useTeamTasks } from '../hooks/useTeamTasks'
import type { Profile } from '../types/database'

interface Props {
  profile: Profile
}

export function Dashboard({ profile }: Props) {
  const { rocks, currentQuarter, loading: rocksLoading, addRock, updateRockStatus, deleteRock } = useRocks(profile.id)
  const { tasks: teamTasks } = useTeamTasks()

  const userName = profile.full_name ?? profile.email.split('@')[0]

  return (
    <div className="flex-1 overflow-auto p-8" style={{ background: '#EEF2F7' }}>
      <div className="max-w-2xl mx-auto">
        {/* Needs You hero */}
        <NeedsYouHero
          rocks={rocks}
          teamTasks={teamTasks}
          userId={profile.id}
          userName={userName}
        />

        {/* Rocks board */}
        <RocksBoard
          rocks={rocks}
          currentQuarter={currentQuarter}
          onAdd={addRock}
          onUpdateStatus={updateRockStatus}
          onDelete={deleteRock}
          loading={rocksLoading}
        />

        {/* Personal task board */}
        <TaskBoard userId={profile.id} />
      </div>
    </div>
  )
}
