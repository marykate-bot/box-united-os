import { useEffect, useState } from 'react'
import { Eye } from 'lucide-react'
import { NeedsYouHero } from '../components/dashboard/NeedsYouHero'
import { RocksBoard } from '../components/dashboard/RocksBoard'
import { TaskBoard } from '../components/dashboard/TaskBoard'
import { useRocks } from '../hooks/useRocks'
import { useTeamTasks } from '../hooks/useTeamTasks'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types/database'

interface Props {
  loggedInProfile: Profile
  viewingUserId: string
}

export function Dashboard({ loggedInProfile, viewingUserId }: Props) {
  const isOwnDashboard = viewingUserId === loggedInProfile.id
  const readOnly = !isOwnDashboard

  const [viewingProfile, setViewingProfile] = useState<Profile | null>(null)

  useEffect(() => {
    if (isOwnDashboard) {
      setViewingProfile(null)
      return
    }
    supabase
      .from('profiles')
      .select('*')
      .eq('id', viewingUserId)
      .single()
      .then(({ data }) => setViewingProfile(data))
  }, [viewingUserId, isOwnDashboard])

  const displayProfile = isOwnDashboard ? loggedInProfile : (viewingProfile ?? loggedInProfile)
  const userName = displayProfile.full_name ?? displayProfile.email.split('@')[0]

  const { rocks, currentQuarter, loading: rocksLoading, addRock, updateRockStatus, deleteRock } = useRocks(viewingUserId)
  const { tasks: teamTasks } = useTeamTasks()

  return (
    <div className="flex-1 overflow-auto p-8" style={{ background: '#EEF2F7' }}>
      <div className="max-w-2xl mx-auto">
        {/* Viewing-as banner */}
        {!isOwnDashboard && (
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-4 text-sm"
            style={{ background: 'rgba(37,99,235,0.08)', color: '#2563EB' }}
          >
            <Eye size={14} />
            <span className="font-medium">
              Viewing {viewingProfile?.full_name ?? viewingProfile?.email?.split('@')[0] ?? '…'}'s dashboard
            </span>
            <span className="text-blue-400 text-xs ml-auto">read-only</span>
          </div>
        )}

        {/* Needs You hero */}
        <NeedsYouHero
          rocks={rocks}
          teamTasks={teamTasks}
          userId={viewingUserId}
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
          readOnly={readOnly}
        />

        {/* Personal task board */}
        <TaskBoard userId={viewingUserId} readOnly={readOnly} />
      </div>
    </div>
  )
}
