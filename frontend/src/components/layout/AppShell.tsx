import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Target, BookOpen, BarChart2, Menu } from 'lucide-react';
import { useApp } from '../../context/AppContext';

// ============================================================
// App Shell — sidebar navigation
// ============================================================

const navItems = [
  { to: '/learn', label: 'Learning Path', icon: BookOpen },
  { to: '/dashboard', label: 'Dashboard', icon: BarChart2 },
];

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { learner } = useApp();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);

  const useMocks = import.meta.env.VITE_USE_MOCKS !== 'false';

  return (
    <div className="h-screen flex overflow-hidden bg-base-200">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-52 bg-white border-r border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-100">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Target size={14} className="text-white" />
          </div>
          <div>
            <span className="font-semibold text-slate-900 text-sm block leading-tight">PathMind</span>
            {useMocks && (
              <span className="text-[10px] text-amber-600 font-medium">Demo mode</span>
            )}
          </div>
        </div>

        {/* Goal summary */}
        {learner?.goal_text && (
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-label mb-1">Current goal</p>
            <p className="text-xs text-slate-600 leading-snug line-clamp-2">{learner.goal_text}</p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                }`
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-100">
          <p className="text-[10px] text-slate-400">PathMind · AI Learning</p>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
            <Target size={12} className="text-white" />
          </div>
          <span className="font-semibold text-slate-900 text-sm">PathMind</span>
        </div>
        <button
          onClick={() => setMobileSidebarOpen(o => !o)}
          className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-md"
          aria-label="Menu"
        >
          <Menu size={18} />
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-slate-900/40"
          onClick={() => setMobileSidebarOpen(false)}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-60 bg-white border-r border-slate-200 p-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                <Target size={14} className="text-white" />
              </div>
              <span className="font-semibold text-slate-900 text-sm">PathMind</span>
            </div>
            <nav className="space-y-1">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100'
                    }`
                  }
                >
                  <Icon size={15} />
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-hidden md:overflow-auto flex flex-col">
        <div className="md:hidden h-[53px] flex-shrink-0" /> {/* mobile top bar spacer */}
        {children}
      </main>
    </div>
  );
}
