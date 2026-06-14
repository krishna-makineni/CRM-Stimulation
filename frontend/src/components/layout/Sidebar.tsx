import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Target,
  Megaphone,
  Sparkles,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    to: '/',
    icon: LayoutDashboard,
    label: 'Dashboard',
    description: 'Overview & metrics',
  },
  {
    to: '/customers',
    icon: Users,
    label: 'Customers',
    description: '5,000 Nykaa contacts',
  },
  {
    to: '/segments',
    icon: Target,
    label: 'Segments',
    description: 'AI-powered audience builder',
  },
  {
    to: '/campaigns',
    icon: Megaphone,
    label: 'Campaigns',
    description: 'Multi-channel campaigns',
  },
  {
    to: '/copilot',
    icon: Sparkles,
    label: 'AI Copilot',
    description: 'Natural language automation',
    highlight: true,
  },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 flex flex-col"
      style={{
        background: 'linear-gradient(180deg, rgba(12,10,28,0.98) 0%, rgba(10,8,24,0.98) 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-white/5">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
            boxShadow: '0 0 20px rgba(124,58,237,0.4)',
          }}
        >
          <Zap className="h-4 w-4 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-white">EngageX</h1>
          <p className="text-[10px] text-white/35 font-medium tracking-widest uppercase">CRM Platform</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 p-3 pt-4">
        <p className="text-[10px] font-semibold tracking-widest text-white/20 uppercase px-3 mb-3">Navigation</p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'text-white'
                  : 'text-white/45 hover:text-white/80 hover:bg-white/5',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: item.highlight
                        ? 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(99,102,241,0.15))'
                        : 'rgba(124,58,237,0.15)',
                      border: '1px solid rgba(124,58,237,0.25)',
                    }}
                  />
                )}
                <div
                  className={cn(
                    'relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all',
                    isActive
                      ? item.highlight
                        ? 'bg-gradient-to-br from-violet-500 to-indigo-500 shadow-lg shadow-violet-500/30'
                        : 'bg-white/10'
                      : 'bg-white/5 group-hover:bg-white/10'
                  )}
                >
                  <item.icon className="h-3.5 w-3.5" />
                </div>
                <div className="relative flex-1 min-w-0">
                  <span className="block text-sm">{item.label}</span>
                </div>
                {item.highlight && !isActive && (
                  <span
                    className="relative shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase"
                    style={{
                      background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(99,102,241,0.3))',
                      color: '#a78bfa',
                      border: '1px solid rgba(124,58,237,0.3)',
                    }}
                  >
                    AI
                  </span>
                )}
                {isActive && (
                  <ChevronRight className="relative h-3.5 w-3.5 text-white/40" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom card */}
      <div className="p-3">
        <div
          className="rounded-xl p-4"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(99,102,241,0.10))',
            border: '1px solid rgba(124,58,237,0.2)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="pulse-dot green" />
            <span className="text-xs font-semibold text-emerald-400">All Systems Operational</span>
          </div>
          <p className="text-[11px] text-white/40 leading-relaxed">
            CRM, Channel & AI services running
          </p>
          <p className="text-[10px] text-white/40 mt-2 leading-relaxed">
            Data is refreshed every hour to keep insights current.
          </p>
        </div>
      </div>
    </aside>
  );
}
