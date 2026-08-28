import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../../contexts/ProjectContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  Search,
  Bug,
  FolderGit2,
  BarChart3,
  Settings,
  Layers,
  Sparkles,
  User,
  ArrowRight,
  X,
  Keyboard,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenReportBug: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenReportBug,
}) => {
  const navigate = useNavigate();
  const { projects, activeProject, selectProject } = useProject();
  const { loginAsDemoPersona } = useAuth();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const actions = [
    {
      id: 'report-bug',
      title: 'Report Defect / Create Issue',
      shortcut: 'B',
      icon: <Bug className="h-4 w-4 text-primary" />,
      run: () => {
        onClose();
        onOpenReportBug();
      },
    },
    {
      id: 'nav-issues',
      title: 'Go to Issues Backlog',
      shortcut: 'G I',
      icon: <Layers className="h-4 w-4 text-purple-400" />,
      run: () => {
        navigate('/issues');
        onClose();
      },
    },
    {
      id: 'nav-projects',
      title: 'Go to Projects & RBAC',
      shortcut: 'G P',
      icon: <FolderGit2 className="h-4 w-4 text-indigo-400" />,
      run: () => {
        navigate('/projects');
        onClose();
      },
    },
    {
      id: 'nav-releases',
      title: 'Go to Releases & Milestones',
      shortcut: 'G R',
      icon: <Layers className="h-4 w-4 text-cyan-400" />,
      run: () => {
        navigate('/releases');
        onClose();
      },
    },
    {
      id: 'nav-ci',
      title: 'Go to CI/CD Automated Test Failures',
      shortcut: 'G C',
      icon: <Sparkles className="h-4 w-4 text-amber-400" />,
      run: () => {
        navigate('/ci-failures');
        onClose();
      },
    },
    {
      id: 'nav-analytics',
      title: 'Go to Analytics & MTTR Telemetry',
      shortcut: 'G T',
      icon: <BarChart3 className="h-4 w-4 text-emerald-400" />,
      run: () => {
        navigate('/analytics');
        onClose();
      },
    },
    {
      id: 'nav-audit',
      title: 'Go to Security & Audit Center',
      shortcut: 'G A',
      icon: <Sparkles className="h-4 w-4 text-indigo-400" />,
      run: () => {
        navigate('/audit');
        onClose();
      },
    },
    {
      id: 'nav-settings',
      title: 'Go to Settings & Developer Webhooks',
      shortcut: 'G S',
      icon: <Settings className="h-4 w-4 text-zinc-400" />,
      run: () => {
        navigate('/settings');
        onClose();
      },
    },
  ];

  const filteredActions = actions.filter((a) =>
    a.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-card border border-border/80 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/60 bg-secondary/20">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, defect key, or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground border border-border">
            ESC
          </kbd>
        </div>

        {/* Action List */}
        <div className="p-2 space-y-1 max-h-80 overflow-y-auto">
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Navigation & Actions
          </div>
          {filteredActions.map((action) => (
            <button
              key={action.id}
              onClick={action.run}
              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-secondary/60 text-xs text-foreground transition-all group text-left"
            >
              <div className="flex items-center gap-2.5">
                {action.icon}
                <span className="font-medium group-hover:text-primary transition-colors">
                  {action.title}
                </span>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded border border-border/50">
                {action.shortcut}
              </span>
            </button>
          ))}

          {/* Switch Project */}
          <div className="px-2 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Switch Active Project
          </div>
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                selectProject(p);
                onClose();
              }}
              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-secondary/60 text-xs text-foreground transition-all group text-left"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-primary text-[11px]">{p.key}</span>
                <span className="text-muted-foreground group-hover:text-foreground">{p.name}</span>
              </div>
              {activeProject?.id === p.id && (
                <span className="text-[10px] text-emerald-400 font-mono">ACTIVE</span>
              )}
            </button>
          ))}

          {/* Switch Persona */}
          <div className="px-2 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Switch Demo Persona
          </div>
          {[
            { role: 'admin' as const, name: 'Alex Martin (Global Admin)' },
            { role: 'pm' as const, name: 'Sarah Connor (Project Manager)' },
            { role: 'dev' as const, name: 'Bob Chen (Lead Engineer)' },
            { role: 'reporter' as const, name: 'Elena Rostova (QA Lead)' },
          ].map((persona) => (
            <button
              key={persona.role}
              onClick={() => {
                loginAsDemoPersona(persona.role);
                onClose();
              }}
              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-secondary/60 text-xs text-foreground transition-all group text-left"
            >
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground group-hover:text-foreground">{persona.name}</span>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground uppercase">{persona.role}</span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border/60 bg-secondary/30 flex items-center justify-between text-[10px] text-muted-foreground font-mono">
          <span>Navigate with arrows or type to filter</span>
          <div className="flex items-center gap-2">
            <span>BugForge v1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
