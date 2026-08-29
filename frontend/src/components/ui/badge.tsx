import * as React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'purple';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'border-border bg-secondary/80 text-foreground',
    secondary: 'border-transparent bg-secondary/50 text-secondary-foreground',
    destructive: 'border-red-500/20 bg-red-500/10 text-red-500',
    outline: 'border-border text-foreground',
    success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500',
    warning: 'border-amber-500/20 bg-amber-500/10 text-amber-500',
    info: 'border-sky-500/20 bg-sky-500/10 text-sky-500',
    purple: 'border-primary/20 bg-primary/10 text-primary',
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
