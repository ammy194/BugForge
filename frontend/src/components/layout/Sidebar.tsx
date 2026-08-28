import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Bug,
  FolderGit2,
  GitPullRequest,
  BarChart3,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const navItems = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard },
    { name: 'Issues & Bugs', to: '/issues', icon: Bug, badge: '12' },
    { name: 'Projects', to: '/projects', icon: FolderGit2 },
    { name: 'Releases', to: '/releases', icon: GitPullRequest },
    { name: 'CI Failures', to: '/ci-failures', icon: Zap, badge: 'NEW' },
    { name: 'Analytics', to: '/analytics', icon: BarChart3 },
    { name: 'Audit Center', to: '/audit', icon: ShieldCheck },
    { name: 'Settings', to: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r border-border/80 bg-card/40 backdrop-blur-xl transition-all duration-300 z-30 select-none',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border/60">
        <NavLink to="/" className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 shadow-md shadow-indigo-500/20 text-white font-bold">
            <Bug className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent">
                BugForge
              </span>
              <span className="text-[10px] text-muted-foreground tracking-wider uppercase font-mono">
                Dev Platform
              </span>
            </div>
          )}
        </NavLink>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto">
        <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          {!collapsed ? 'Workspace' : '•••'}
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary/15 text-primary border border-primary/20 shadow-sm font-semibold'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )
              }
              title={collapsed ? item.name : undefined}
            >
              <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
              {!collapsed && <span className="flex-1 truncate">{item.name}</span>}
              {!collapsed && item.badge && (
                <Badge variant="purple" className="px-1.5 py-0 text-[10px] font-mono">
                  {item.badge}
                </Badge>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* AI Assistant Banner (Bottom) */}
      {!collapsed && (
        <div className="p-3 mx-3 mb-3 rounded-lg border border-purple-500/20 bg-purple-500/5 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-300 mb-1">
            <Sparkles className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
            <span>Grok AI Engine</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Real-time duplicate detection & smart intake active.
          </p>
        </div>
      )}

      {/* System Status Footer & Collapse Toggle */}
      <div className="flex items-center justify-between p-3 border-t border-border/60 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          {!collapsed && <span className="font-mono text-[11px]">API: Online</span>}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded p-1 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
};
