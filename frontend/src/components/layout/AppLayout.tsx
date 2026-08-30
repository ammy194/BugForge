import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { CreateIssueModal } from '../issues/CreateIssueModal';
import { CommandPalette } from '../common/CommandPalette';
import { useProject } from '../../contexts/ProjectContext';
import { Badge } from '../ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Keyboard, X } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const { refreshProjects } = useProject();

  // Multi-key sequence tracker for 'g' then 'x'
  useEffect(() => {
    let lastKey = '';
    let lastKeyTime = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
      if (isInput) return;

      const now = Date.now();
      const key = e.key.toLowerCase();

      // Cmd/Ctrl + K or '/'
      if ((e.metaKey || e.ctrlKey) && key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
        return;
      }

      if (key === '/') {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }

      // 'c' or 'b' for report bug
      if (key === 'c' || key === 'b') {
        e.preventDefault();
        setCreateModalOpen(true);
        return;
      }

      // '?' for shortcuts
      if (key === '?') {
        e.preventDefault();
        setShortcutsModalOpen((prev) => !prev);
        return;
      }

      // Multi-key 'g' sequence
      if (lastKey === 'g' && now - lastKeyTime < 800) {
        if (key === 'i') navigate('/issues');
        if (key === 'p') navigate('/projects');
        if (key === 'a') navigate('/analytics');
        if (key === 'r') navigate('/releases');
        if (key === 's') navigate('/settings');
        lastKey = '';
        return;
      }

      if (key === 'g') {
        lastKey = 'g';
        lastKeyTime = now;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden font-sans">
      {/* Skip to main content */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:text-primary focus:outline-none focus:ring-2 focus:ring-primary"
      >
        Skip to main content
      </a>

      {/* Sidebar */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar 
          onReportBugClick={() => setCreateModalOpen(true)}
          onSearchClick={() => setCommandPaletteOpen(true)} 
        />
        <main id="main-content" className="flex-1 overflow-y-auto p-6 md:p-8 bg-gradient-to-b from-background via-background to-secondary/10">
          <Outlet />
        </main>
      </div>

      {/* Global Create Issue Modal */}
      <CreateIssueModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onIssueCreated={() => {
          refreshProjects();
        }}
      />

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onOpenReportBug={() => setCreateModalOpen(true)}
      />

      {/* Shortcuts Helper Modal */}
      {shortcutsModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setShortcutsModalOpen(false)}
        >
          <Card className="w-full max-w-md bg-card border-border/80 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <Keyboard className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-bold">Keyboard Power Shortcuts</CardTitle>
              </div>
              <button
                onClick={() => setShortcutsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-1.5 rounded bg-secondary/30">
                <span className="text-muted-foreground">Focus Command / Search</span>
                <kbd className="font-mono text-[10px] bg-secondary px-2 py-0.5 rounded border border-border">/ or ⌘K</kbd>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-secondary/30">
                <span className="text-muted-foreground">Report Defect / Create Bug</span>
                <kbd className="font-mono text-[10px] bg-secondary px-2 py-0.5 rounded border border-border">B or C</kbd>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-secondary/30">
                <span className="text-muted-foreground">Go to Issues Backlog</span>
                <kbd className="font-mono text-[10px] bg-secondary px-2 py-0.5 rounded border border-border">G then I</kbd>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-secondary/30">
                <span className="text-muted-foreground">Go to Projects</span>
                <kbd className="font-mono text-[10px] bg-secondary px-2 py-0.5 rounded border border-border">G then P</kbd>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-secondary/30">
                <span className="text-muted-foreground">Go to Analytics</span>
                <kbd className="font-mono text-[10px] bg-secondary px-2 py-0.5 rounded border border-border">G then A</kbd>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-secondary/30">
                <span className="text-muted-foreground">Toggle Shortcuts Cheatsheet</span>
                <kbd className="font-mono text-[10px] bg-secondary px-2 py-0.5 rounded border border-border">?</kbd>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
