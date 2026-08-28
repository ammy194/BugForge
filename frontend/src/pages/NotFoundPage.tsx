import React from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center space-y-4">
      <div className="rounded-full bg-red-500/10 p-4 text-red-400 border border-red-500/20">
        <AlertCircle className="h-10 w-10" />
      </div>
      <h2 className="text-3xl font-bold tracking-tight text-foreground">404 — View Not Found</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        The defect, dashboard view, or resource you requested could not be located in this workspace.
      </p>
      <NavLink to="/">
        <Button variant="outline" className="gap-2 mt-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Dashboard</span>
        </Button>
      </NavLink>
    </div>
  );
};
