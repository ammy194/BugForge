import React from 'react';
import { Search, Plus, Bell, Command, Github, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar } from '../ui/avatar';
import { Badge } from '../ui/badge';

interface NavbarProps {
  onReportBugClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onReportBugClick }) => {
  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-border/80 bg-background/80 px-6 backdrop-blur-xl">
      {/* Left: Project Selector & Search */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        {/* Project Selector pill */}
        <div className="hidden sm:flex items-center gap-2 rounded-lg border border-border/60 bg-secondary/40 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/70 transition-colors cursor-pointer">
          <span className="flex h-2 w-2 rounded-full bg-indigo-500"></span>
          <span className="font-semibold text-foreground">E-Commerce Platform</span>
          <span className="text-[10px] text-muted-foreground font-mono bg-background/60 px-1.5 py-0.5 rounded border border-border/40">
            ECOM
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-1" />
        </div>

        {/* Global Quick Search */}
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

      {/* Right: Actions, Notifications, Profile */}
      <div className="flex items-center gap-3">
        {/* Primary Action Button */}
        <Button
          variant="glow"
          size="sm"
          onClick={onReportBugClick}
          className="gap-1.5 font-semibold text-xs tracking-wide shadow-md"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Report Bug</span>
        </Button>

        {/* GitHub Quick Link / Status */}
        <button
          title="GitHub Integration Active"
          className="relative rounded-lg border border-border/60 bg-secondary/30 p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <Github className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
        </button>

        {/* Notifications Trigger */}
        <button
          title="Notifications"
          className="relative rounded-lg border border-border/60 bg-secondary/30 p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">
            3
          </span>
        </button>

        {/* Vertical Divider */}
        <div className="h-6 w-[1px] bg-border/60 mx-1"></div>

        {/* User Profile */}
        <div className="flex items-center gap-2.5 pl-1 cursor-pointer group">
          <Avatar
            fallback="Alex Martin"
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face"
            size="sm"
            className="ring-primary/40 group-hover:ring-primary transition-all"
          />
          <div className="hidden md:flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                Alex Martin
              </span>
              <Badge variant="purple" className="px-1 py-0 text-[9px] font-semibold">
                ADMIN
              </Badge>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">alex@bugforge.dev</span>
          </div>
        </div>
      </div>
    </header>
  );
};
