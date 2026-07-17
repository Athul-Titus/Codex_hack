import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, Sparkles, Calendar, Zap } from 'lucide-react'

const navItems = [
  { to: '/',          label: 'Home',             icon: LayoutDashboard },
  { to: '/pulse',     label: 'Workforce Pulse',  icon: Users },
  { to: '/content',   label: 'Content Spark',    icon: Sparkles },
  { to: '/scheduler', label: 'Smart Scheduler',  icon: Calendar },
]

export default function Sidebar() {
  return (
    <aside className="w-64 flex-shrink-0 bg-surface-800 border-r border-white/[0.06] flex flex-col h-screen">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-6 border-b border-white/[0.06]">
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-glow">
          <Zap size={16} className="text-white" />
        </div>
        <div>
          <span className="text-base font-bold text-white tracking-tight">OpsPilot</span>
          <p className="text-xs text-slate-500 font-normal leading-none mt-0.5">AI Operations Co-pilot</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="px-3 mb-2 text-xs font-semibold text-slate-600 uppercase tracking-wider">Navigation</p>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => isActive ? 'nav-item-active' : 'nav-item'}
          >
            <Icon size={16} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
            A
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-300 truncate">Admin</p>
            <p className="text-xs text-slate-600 truncate">admin@opspilot.ai</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
