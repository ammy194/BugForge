import React, { useState } from 'react';
import { Search, Plus, Bell, Command, Github, ChevronDown, LogOut, User, Sparkles, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { useAuth, DEMO_PERSONAS } from '../../contexts/AuthContext';

interface NavbarProps {
  onReportBugClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onReportBugClick }) => {
  const { user, logout, loginAsDemoPersona } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

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
      {/* Left: Project Selector & Search */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="hidden sm:flex items-center gap-2 rounded-lg border border-border/60 bg-secondary/40 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/70 transition-colors cursor-pointer">
          <span className="flex h-2 w-2 rounded-full bg-indigo-500"></span>
          <span className="font-semibold text-foreground">E-Commerce Platform</span>
          <span className="text-[10px] text-muted-foreground font-mono bg-background/60 px-1.5 py-0.5 rounded border border-border/40">
            ECOM
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-1" />
        </div>

        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="Search issues, commits, labels... (Press / to focus)"
            icon={<Search className="h-4 w-4" />}
            className="bg-secondary/40 border-border/60 text-xs h-9 pr-12 focus:bg-background"
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

        <button
          title="GitHub Integration Active"
          className="relative rounded-lg border border-border/60 bg-secondary/30 p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <Github className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
        </button>

        <button
          title="Notifications"
          className="relative rounded-lg border border-border/60 bg-secondary/30 p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">
            3
          </span>
        </button>

        <div className="h-6 w-[1px] bg-border/60 mx-1"></div>

        {/* User Profile & Dropdown */}
        <div className="relative">
          <div
            onClick={() => setDropdownOpen(!dropdownOpen)}
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
                <Badge variant={getRoleBadgeVariant(user?.global_role) as any} className="px-1 py-0 text-[9px] font-semibold">
                  {user?.global_role || 'DEV'}
                </Badge>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">{user?.email || 'user@bugforge.dev'}</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-0.5" />
          </div>

          {/* Profile Dropdown Menu */}
          {dropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-64 rounded-xl border border-border/80 bg-card/95 backdrop-blur-xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100"
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <div className="px-3 py-2 border-b border-border/60">
                <p className="text-xs font-semibold text-foreground">{user?.full_name}</p>
                <p className="text-[11px] text-muted-foreground font-mono">{user?.email}</p>
              </div>

              {/* Fast Switch Persona (for testing & judging) */}
              <div className="py-2 px-1 border-b border-border/60">
                <div className="px-2 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-purple-400" />
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
                        setDropdownOpen(false);
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
                    setDropdownOpen(false);
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
