import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  const handleReportBug = () => {
    // Will be wired to Phase 4 Core Bug Creation modal
    window.location.hash = '#create-issue';
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onReportBugClick={handleReportBug} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-gradient-to-b from-background via-background to-secondary/10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
