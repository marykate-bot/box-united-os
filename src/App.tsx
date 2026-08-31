import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { LoginPage } from './components/auth/LoginPage'
import { Sidebar } from './components/layout/Sidebar'
import { Dashboard } from './pages/Dashboard'
import { TeamBoard } from './components/team/TeamBoard'

type Page = 'dashboard' | 'team'

export default function App() {
  const { user, profile, loading, signInWithGoogle, signOut } = useAuth()
  const [page, setPage] = useState<Page>('dashboard')

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

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#EEF2F7' }}>
      <Sidebar
        profile={profile}
        activePage={page}
        onNavigate={setPage}
        onSignOut={signOut}
      />

      <main className="flex-1 overflow-hidden flex flex-col">
        {page === 'dashboard' && profile ? (
          <Dashboard profile={profile} />
        ) : page === 'team' ? (
          <TeamBoard
            currentUserId={user.id}
          />
        ) : null}
      </main>
    </div>
  )
}
