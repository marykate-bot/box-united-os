import { LayoutDashboard, Users, LogOut, Dumbbell } from 'lucide-react'
import type { Profile } from '../../types/database'

interface Props {
  profile: Profile | null
  activePage: 'dashboard' | 'team'
  onNavigate: (page: 'dashboard' | 'team') => void
  onSignOut: () => void
}

const navItems = [
  { id: 'dashboard' as const, label: 'My Dashboard', icon: LayoutDashboard },
  { id: 'team' as const, label: 'Team Board', icon: Users },
]

export function Sidebar({ profile, activePage, onNavigate, onSignOut }: Props) {
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : profile?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <aside
      className="flex flex-col w-[220px] shrink-0 h-screen"
      style={{ background: '#0B1E39' }}
    >
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#2563EB' }}>
            <Dumbbell size={16} className="text-white" />
          </div>
          <div>
            <p className="text-white text-sm font-semibold leading-tight" style={{ fontFamily: 'Archivo, sans-serif' }}>
              Box United OS
            </p>
            <p className="text-blue-300 text-xs mt-0.5">Operations</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(item => {
          const Icon = item.icon
          const active = activePage === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left"
              style={{
                background: active ? 'rgba(37,99,235,0.25)' : 'transparent',
                color: active ? '#93c5fd' : 'rgba(255,255,255,0.6)',
              }}
            >
              <Icon size={16} />
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-3 pb-5 border-t border-white/10 pt-4">
        <div className="flex items-center gap-3 px-2 mb-3">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: '#2563EB' }}
            >
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-white text-xs font-medium truncate">
              {profile?.full_name ?? 'Team Member'}
            </p>
            <p className="text-blue-300 text-xs truncate opacity-70">{profile?.email}</p>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
