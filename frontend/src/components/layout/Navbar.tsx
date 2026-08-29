import React, { useState } from 'react';
import { Search, Plus, Bell, Command, Github, ChevronDown, LogOut, Sparkles, Check, FolderGit2, Zap, Bug, GitPullRequest, MessageSquare, User } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { useAuth, DEMO_PERSONAS } from '../../contexts/AuthContext';
import { useProject } from '../../contexts/ProjectContext';
import { api } from '../../lib/api';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  issue_key?: string;
}

interface NavbarProps {
  onReportBugClick?: () => void;
  onSearchClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onReportBugClick, onSearchClick }) => {
  const { user, logout, loginAsDemoPersona } = useAuth();
  const { projects, activeProject, selectProject, userProjectRole } = useProject();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = React.useCallback(async () => {
    try {
      const data = await api.get<Notification[]>('/notifications');
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      setNotifications([]);
    }
  }, []);

  React.useEffect(() => {
    if (user) fetchNotifications();

    const handler = () => {
      if (user) fetchNotifications();
    };
    
    window.addEventListener('fetch_notifications', handler);
    return () => window.removeEventListener('fetch_notifications', handler);
  }, [user, fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'CI_FAILURE': return <Zap className="h-3 w-3 text-red-400" />;
      case 'ASSIGNED': return <User className="h-3 w-3 text-blue-400" />;
      case 'MENTIONED': return <MessageSquare className="h-3 w-3 text-purple-400" />;
      case 'RESOLVED': return <Check className="h-3 w-3 text-emerald-400" />;
      case 'STATUS_CHANGED': return <GitPullRequest className="h-3 w-3 text-yellow-400" />;
      default: return <Bug className="h-3 w-3 text-primary" />;
    }
  };

  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'purple';
      case 'PROJECT_MANAGER':
        return 'info';
      case 'DEVELOPER':
        return 'success';
      case 'REPORTER':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-border/80 bg-background/80 px-6 backdrop-blur-xl">
      {/* Left: Project Selector Dropdown & Quick Search */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        {/* Project Selector Dropdown */}
        <div className="relative">
          <div
            onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
            className="flex items-center gap-2 rounded-lg border border-border/60 bg-secondary/40 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/70 transition-colors cursor-pointer select-none"
          >
            <span className="flex h-2 w-2 rounded-full bg-primary"></span>
            <span className="font-semibold text-foreground max-w-[140px] truncate">
              {activeProject ? activeProject.name : 'Select Project'}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono bg-background/60 px-1.5 py-0.5 rounded border border-border/40">
              {activeProject ? activeProject.key : '---'}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-1" />
          </div>

          {projectDropdownOpen && (
            <div
              className="absolute left-0 mt-2 w-64 rounded-xl border border-border/80 bg-card/95 backdrop-blur-xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100"
              onMouseLeave={() => setProjectDropdownOpen(false)}
            >
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Projects Workspace
              </div>
              <div className="space-y-1">
                {projects.map((p) => {
                  const isSelected = activeProject?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        selectProject(p);
                        setProjectDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors ${
                        isSelected
                          ? 'bg-primary/15 text-primary font-semibold'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono text-[10px] bg-secondary px-1.5 py-0.5 rounded border border-border/40 text-foreground">
                          {p.key}
                        </span>
                        <span className="truncate">{p.name}</span>
                      </div>
                      {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Global Quick Search */}
        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="Search issues, commits, labels... (Press / to focus)"
            icon={<Search className="h-4 w-4" />}
            className="bg-secondary/40 border-border/60 text-xs h-9 pr-12 focus:bg-background cursor-pointer"
            onClick={onSearchClick}
            readOnly
          />
          <div className="absolute right-2.5 top-2 flex items-center gap-0.5 rounded border border-border/60 bg-background/80 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground pointer-events-none">
            <Command className="h-2.5 w-2.5" />
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Right: Actions, Notifications, Profile Dropdown */}
      <div className="flex items-center gap-3">
        <Button
          variant="glow"
          size="sm"
          onClick={onReportBugClick}
          className="gap-1.5 font-semibold text-xs tracking-wide shadow-md"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Report Bug</span>
        </Button>

        <a
          href="https://github.com/ammy194/BugForge"
          target="_blank"
          rel="noopener noreferrer"
          title="GitHub Repository"
          className="relative rounded-lg border border-border/60 bg-secondary/30 p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <Github className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
        </a>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            title="Notifications"
            onClick={() => { setNotificationsOpen(!notificationsOpen); if (!notificationsOpen) fetchNotifications(); }}
            className="relative rounded-lg border border-border/60 bg-secondary/30 p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-black">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          
          {notificationsOpen && (
            <div 
              className="absolute right-0 mt-2 w-80 rounded-xl border border-border/80 bg-card/95 backdrop-blur-xl p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100"
              onMouseLeave={() => setNotificationsOpen(false)}
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-2">
                <span className="text-xs font-semibold text-foreground">Live Notifications</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllRead}
                    className="text-[10px] text-muted-foreground hover:text-primary transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    <Bell className="h-5 w-5 mx-auto mb-2 opacity-30" />
                    No notifications yet
                  </div>
                ) : (
                  notifications.slice(0, 10).map(n => (
                    <div key={n.id} className={`flex gap-2.5 rounded-lg p-2 transition-colors ${!n.read ? 'bg-primary/5 border border-primary/10' : 'hover:bg-secondary/30'}`}>
                      <span className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${!n.read ? 'bg-primary' : 'bg-muted-foreground/30'}`}></span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {getNotifIcon(n.type)}
                          <span className="text-xs font-medium text-foreground truncate">{n.title}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground line-clamp-2">{n.message}</span>
                        {n.issue_key && (
                          <span className="text-[9px] font-mono text-primary/70 mt-0.5">{n.issue_key}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-[1px] bg-border/60 mx-1"></div>

        {/* User Profile & Dropdown */}
        <div className="relative">
          <div
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2.5 pl-1 cursor-pointer group"
          >
            <Avatar
              fallback={user?.full_name || 'Alex Martin'}
              src={user?.avatar_url}
              size="sm"
              className="ring-primary/40 group-hover:ring-primary transition-all"
            />
            <div className="hidden md:flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                  {user?.full_name || 'Guest User'}
                </span>
                <Badge variant={getRoleBadgeVariant(userProjectRole) as any} className="px-1 py-0 text-[9px] font-semibold">
                  {userProjectRole}
                </Badge>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">{user?.email || 'user@bugforge.dev'}</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-0.5" />
          </div>

          {profileDropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-64 rounded-xl border border-border/80 bg-card/95 backdrop-blur-xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100"
              onMouseLeave={() => setProfileDropdownOpen(false)}
            >
              <div className="px-3 py-2 border-b border-border/60">
                <p className="text-xs font-semibold text-foreground">{user?.full_name}</p>
                <p className="text-[11px] text-muted-foreground font-mono">{user?.email}</p>
                <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span>Active Role:</span>
                  <Badge variant={getRoleBadgeVariant(userProjectRole) as any} className="px-1.5 py-0 text-[9px]">
                    {userProjectRole}
                  </Badge>
                </div>
              </div>

              {/* Fast Switch Persona */}
              <div className="py-2 px-1 border-b border-border/60">
                <div className="px-2 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span>Switch Role Persona</span>
                </div>
                {(['admin', 'pm', 'dev', 'reporter'] as const).map((key) => {
                  const p = DEMO_PERSONAS[key];
                  const isActive = user?.email === p.email;
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        loginAsDemoPersona(key);
                        setProfileDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors ${
                        isActive
                          ? 'bg-primary/15 text-primary font-semibold'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      }`}
                    >
                      <span>{p.full_name}</span>
                      {isActive && <Check className="h-3.5 w-3.5 text-primary" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-1">
                <button
                  onClick={() => {
                    logout();
                    setProfileDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
