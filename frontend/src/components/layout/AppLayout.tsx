import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { CreateIssueModal } from '../issues/CreateIssueModal';
import { useProject } from '../../contexts/ProjectContext';

export const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { refreshProjects } = useProject();

  // Keyboard shortcut listener for quick defect reporting (Cmd/Ctrl + Shift + N or press 'c' outside inputs)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
      if (isInput) return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setCreateModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onReportBugClick={() => setCreateModalOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-gradient-to-b from-background via-background to-secondary/10">
          <Outlet />
        </main>
      </div>

      {/* Global Create Issue / Report Bug Modal */}
      <CreateIssueModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onIssueCreated={() => {
          refreshProjects();
        }}
      />
    </div>
  );
};
