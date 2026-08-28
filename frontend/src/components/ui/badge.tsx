import * as React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'purple';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'border-transparent bg-primary text-primary-foreground shadow',
    secondary: 'border-transparent bg-secondary text-secondary-foreground',
    destructive: 'border-transparent bg-red-500/15 text-red-400 border border-red-500/30',
    outline: 'border-border text-foreground',
    success: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400',
    warning: 'border-amber-500/30 bg-amber-500/15 text-amber-400',
    info: 'border-sky-500/30 bg-sky-500/15 text-sky-400',
    purple: 'border-purple-500/30 bg-purple-500/15 text-purple-400',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
