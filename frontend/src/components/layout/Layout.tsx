import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Bell, Search, Settings } from 'lucide-react';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Nykaa CRM performance overview' },
  '/customers': { title: 'Customers', subtitle: '5,000 Nykaa beauty customers' },
  '/segments': { title: 'Segments', subtitle: 'AI-powered audience segmentation' },
  '/campaigns': { title: 'Campaign Copilot', subtitle: 'AI-assisted campaign generation and deployment' },
  '/copilot': { title: 'AI Copilot', subtitle: 'Natural language campaign automation' },
};

export function Layout() {
  const location = useLocation();
  let pageInfo = pageTitles[location.pathname] || pageTitles['/'];

  if (location.pathname.startsWith('/campaigns/')) {
    pageInfo = { title: 'Campaign Copilot', subtitle: 'AI-assisted campaign generation and deployment' };
  } else if (location.pathname.startsWith('/customers/')) {
    pageInfo = { title: 'Customers', subtitle: 'Customer details and behavior' };
  }
  const [globalSearch, setGlobalSearch] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const closeAllPanels = () => {
    setShowNotifications(false);
    setShowSettings(false);
    setShowProfileMenu(false);
  };

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="ml-64 min-h-screen flex flex-col">
        {/* Top Header */}
        <header
          className="relative sticky top-0 z-30 flex h-16 items-center gap-4 px-8"
          style={{
            background: 'rgba(10,8,24,0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
          onClick={closeAllPanels}
        >
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-white/90">{pageInfo.title}</h2>
            <p className="text-xs text-white/35">{pageInfo.subtitle}</p>
          </div>

          {/* Search */}
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/35"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              minWidth: 200,
            }}
          >
            <Search className="h-3.5 w-3.5" />
            <input
              type="text"
              value={globalSearch}
              onChange={(event) => setGlobalSearch(event.target.value)}
              placeholder="Search anything..."
              className="flex-1 bg-transparent text-xs text-white placeholder:text-white/35 outline-none"
            />
            <kbd className="ml-auto rounded px-1.5 py-0.5 text-[9px] font-mono" style={{ background: 'rgba(255,255,255,0.08)' }}>⌘K</kbd>
          </div>

          {/* Actions */}
          <button
            className="relative flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 transition-all"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setShowNotifications((prev) => !prev);
              setShowSettings(false);
              setShowProfileMenu(false);
            }}
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-violet-500" />
          </button>
          <button
            className="relative flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 transition-all"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setShowSettings((prev) => !prev);
              setShowNotifications(false);
              setShowProfileMenu(false);
            }}
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* Avatar */}
          <button
            className="relative flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setShowProfileMenu((prev) => !prev);
              setShowNotifications(false);
              setShowSettings(false);
            }}
          >
            N
          </button>

          {showNotifications && (
            <div className="absolute right-28 top-full mt-2 w-64 rounded-3xl border border-white/10 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-xl">
              <p className="text-sm font-semibold text-white">Notifications</p>
              <p className="mt-2 text-sm text-white/60">No new notifications at the moment.</p>
            </div>
          )}
          {showSettings && (
            <div className="absolute right-20 top-full mt-2 w-64 rounded-3xl border border-white/10 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-xl">
              <p className="text-sm font-semibold text-white">Settings</p>
              <p className="mt-2 text-sm text-white/60">Preferences and account settings will appear here soon.</p>
            </div>
          )}
          {showProfileMenu && (
            <div className="absolute right-10 top-full mt-2 w-56 rounded-3xl border border-white/10 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-xl">
              <p className="text-sm font-semibold text-white">Profile</p>
              <p className="mt-2 text-sm text-white/60">Signed in as <span className="font-medium text-white">N</span>.</p>
            </div>
          )}
        </header>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
