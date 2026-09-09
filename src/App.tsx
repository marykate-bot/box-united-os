import { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { LoginPage } from './components/auth/LoginPage'
import { Sidebar } from './components/layout/Sidebar'
import { Dashboard } from './pages/Dashboard'
import { TeamBoard } from './components/team/TeamBoard'
import { Scorecard } from './pages/AnnualGoals'
import { DecisionLog } from './pages/DecisionLog'
import { TeamMeeting } from './pages/TeamMeeting'
import { supabase } from './lib/supabase'
import type { Profile } from './types/database'

type Page = 'dashboard' | 'team' | 'scorecard' | 'decisions' | 'meeting'

export default function App() {
  const { user, profile, loading, signInWithGoogle, signOut } = useAuth()
  const [page, setPage] = useState<Page>('dashboard')
  const [viewingUserId, setViewingUserId] = useState<string | null>(null)
  const [allProfiles, setAllProfiles] = useState<Profile[]>([])

  // Effective viewing user — null means "own dashboard"
  const effectiveViewingUserId = viewingUserId ?? user?.id ?? ''

  // Fetch all profiles for owner/person pickers
  useEffect(() => {
    if (!user) return
    supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true })
      .then(({ data }) => setAllProfiles(data ?? []))
  }, [user?.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#EEF2F7' }}>
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #0B1E39 0%, #2563EB 100%)' }}
          >
            <span className="text-white font-bold text-lg" style={{ fontFamily: 'Archivo, sans-serif' }}>B</span>
          </div>
          <div className="w-5 h-5 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage onSignIn={signInWithGoogle} />
  }

  function handleSelectUser(uid: string) {
    setViewingUserId(uid === user!.id ? null : uid)
    setPage('dashboard')
  }

  function handleNavigate(p: string) {
    setPage(p as Page)
    // When navigating away from dashboard, reset viewing user
    if (p !== 'dashboard') setViewingUserId(null)
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#EEF2F7' }}>
      <Sidebar
        profile={profile}
        activePage={page}
        onNavigate={handleNavigate}
        onSignOut={signOut}
        loggedInUserId={user.id}
        viewingUserId={effectiveViewingUserId}
        onSelectUser={handleSelectUser}
      />

      <main className="flex-1 overflow-hidden flex flex-col">
        {page === 'dashboard' && profile ? (
          <Dashboard
            loggedInProfile={profile}
            viewingUserId={effectiveViewingUserId}
          />
        ) : page === 'team' ? (
          <TeamBoard currentUserId={user.id} />
        ) : page === 'scorecard' ? (
          <Scorecard
            loggedInUserId={user.id}
            profiles={allProfiles}
          />
        ) : page === 'decisions' ? (
          <DecisionLog
            loggedInUserId={user.id}
            profiles={allProfiles}
          />
        ) : page === 'meeting' ? (
          <TeamMeeting
            loggedInUserId={user.id}
            profiles={allProfiles}
          />
        ) : null}
      </main>
    </div>
  )
}
