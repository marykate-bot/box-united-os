import { useEffect, useState } from 'react'
import { LayoutDashboard, Users, LogOut, Dumbbell, Target, BookOpen, ClipboardList } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Profile } from '../../types/database'

type Page = string

interface Props {
  profile: Profile | null
  activePage: Page
  onNavigate: (page: Page) => void
  onSignOut: () => void
  loggedInUserId: string
  viewingUserId: string
  onSelectUser: (userId: string) => void
}

const navItems: { id: string; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'My Dashboard', icon: LayoutDashboard },
  { id: 'team',      label: 'Team Board',   icon: Users },
  { id: 'scorecard', label: 'Scorecard',    icon: Target },
  { id: 'decisions', label: 'Decision Log', icon: BookOpen },
  { id: 'meeting',   label: 'Team Meeting', icon: ClipboardList },
]

// Hardcoded fallback team members (for Claire & Alexandra before they sign up)
const FALLBACK_OTHERS = [
  { name: 'Claire',    initials: 'CL' },
  { name: 'Alexandra', initials: 'AL' },
]

function avatarInitials(profile: Profile) {
  if (profile.full_name) {
    return profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  }
  return profile.email[0]?.toUpperCase() ?? '?'
}

export function Sidebar({
  profile,
  activePage,
  onNavigate,
  onSignOut,
  loggedInUserId,
  viewingUserId,
  onSelectUser,
}: Props) {
  const [otherProfiles, setOtherProfiles] = useState<Profile[]>([])

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .neq('id', loggedInUserId)
      .order('full_name', { ascending: true })
      .then(({ data }) => setOtherProfiles(data ?? []))
  }, [loggedInUserId])

  // Build the display list for other team members (2 slots with fallback)
  const displayOthers: Array<{ id: string | null; name: string; initials: string; avatarUrl: string | null }> =
    FALLBACK_OTHERS.map(placeholder => {
      const real = otherProfiles.find(p =>
        (p.full_name ?? '').toLowerCase().startsWith(placeholder.name.toLowerCase())
      )
      if (real) {
        return {
          id: real.id,
          name: real.full_name ?? real.email,
          initials: avatarInitials(real),
          avatarUrl: real.avatar_url,
        }
      }
      return { id: null, name: placeholder.name, initials: placeholder.initials, avatarUrl: null }
    })

  const selfInitials = profile ? avatarInitials(profile) : '?'

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

      {/* Team switcher */}
      <div className="px-4 py-4 border-b border-white/10">
        <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-3 px-1">Team</p>
        <div className="flex items-center gap-2">
          {/* Self */}
          <button
            onClick={() => onSelectUser(loggedInUserId)}
            title={profile?.full_name ?? profile?.email ?? 'Me'}
            className="relative shrink-0"
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="w-9 h-9 rounded-full object-cover transition-all"
                style={{
                  outline: viewingUserId === loggedInUserId ? '2px solid #2563EB' : '2px solid transparent',
                  outlineOffset: '2px',
                }}
              />
            ) : (
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white transition-all"
                style={{
                  background: viewingUserId === loggedInUserId ? '#2563EB' : '#1e3a5f',
                  outline: viewingUserId === loggedInUserId ? '2px solid #2563EB' : '2px solid transparent',
                  outlineOffset: '2px',
                }}
              >
                {selfInitials}
              </div>
            )}
          </button>

          {/* Other team members */}
          {displayOthers.map((member, i) => {
            const isViewing = member.id !== null && viewingUserId === member.id
            return (
              <button
                key={member.id ?? `placeholder-${i}`}
                onClick={() => member.id ? onSelectUser(member.id) : undefined}
                title={member.name}
                disabled={member.id === null}
                className="relative shrink-0"
                style={{ cursor: member.id ? 'pointer' : 'default' }}
              >
                {member.avatarUrl ? (
                  <img
                    src={member.avatarUrl}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover"
                    style={{
                      outline: isViewing ? '2px solid #2563EB' : '2px solid transparent',
                      outlineOffset: '2px',
                    }}
                  />
                ) : (
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white/60 transition-all"
                    style={{
                      background: isViewing ? '#1e3a5f' : 'rgba(255,255,255,0.08)',
                      outline: isViewing ? '2px solid #2563EB' : '2px solid transparent',
                      outlineOffset: '2px',
                      opacity: member.id === null ? 0.4 : 1,
                    }}
                  >
                    {member.initials}
                  </div>
                )}
              </button>
            )
          })}
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
              {selfInitials}
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
