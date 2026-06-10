import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { User, ChevronDown, LogOut, LayoutDashboard, Workflow, Cpu } from 'lucide-react'
import { useState } from 'react'

export default function TopBar({ user }) {
  const navigate   = useNavigate()
  const location   = useLocation()
  const { jobId }  = useParams()
  const [dropOpen, setDropOpen] = useState(false)

  // Build nav items — preserve jobId in processing/dashboard links
  const NAV = [
    { label: 'New Analysis', path: '/workflow',                          icon: Workflow },
    { label: 'Processing',   path: jobId ? `/processing/${jobId}` : null, icon: Cpu },
    { label: 'Dashboard',    path: jobId ? `/dashboard/${jobId}` : null,  icon: LayoutDashboard },
  ]

  const isActive = (path) => path && location.pathname.startsWith(path.split('/').slice(0, 2).join('/'))

  return (
    <header className="sticky top-0 z-50 h-14 border-b border-surface-border bg-surface-base/90 backdrop-blur-sm flex items-center px-6 gap-6">
      {/* Brand */}
      <div
        onClick={() => navigate('/workflow')}
        className="flex items-center gap-2.5 min-w-max cursor-pointer"
      >
        <div className="w-7 h-7 rounded-md bg-orange-500 flex items-center justify-center">
          <span className="text-white font-bold text-xs">C</span>
        </div>
        <span className="text-text-primary font-semibold tracking-tight text-sm">
          Clarity <span className="text-orange-500">from Chaos</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex items-center gap-1 ml-2">
        {NAV.map(({ label, path, icon: Icon }) => {
          const active = isActive(path)
          const disabled = !path
          return (
            <button
              key={label}
              onClick={() => path && navigate(path)}
              disabled={disabled}
              title={disabled ? 'Start an analysis first' : ''}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                disabled  ? 'text-text-muted cursor-not-allowed opacity-40' :
                active    ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          )
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User menu */}
      <div className="relative">
        <button
          onClick={() => setDropOpen(p => !p)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-surface-border hover:border-orange-500/30 transition-colors group"
        >
          <div className="w-6 h-6 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
            <User size={12} className="text-orange-400" />
          </div>
          <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
            {user?.username || 'User'}
          </span>
          <ChevronDown size={13} className="text-text-muted" />
        </button>

        {dropOpen && (
          <div className="absolute right-0 top-full mt-2 w-44 bg-surface-elevated border border-surface-border rounded-xl shadow-card overflow-hidden z-50">
            <div className="px-4 py-3 border-b border-surface-border">
              <p className="text-xs text-text-muted">Signed in as</p>
              <p className="text-sm font-medium text-text-primary mt-0.5">{user?.username}</p>
            </div>
            <button
              onClick={() => { setDropOpen(false); navigate('/') }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-overlay transition-colors"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
