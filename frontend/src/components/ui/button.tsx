import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'glow' | 'action';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]';

    const variants = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md shadow-destructive/20',
      outline: 'border border-border bg-transparent hover:bg-secondary hover:text-secondary-foreground',
      secondary: 'bg-secondary border border-border text-foreground hover:border-primary/30 hover:text-primary transition-colors',
      ghost: 'hover:bg-secondary hover:text-secondary-foreground',
      link: 'text-primary underline-offset-4 hover:underline p-0 h-auto',
      glow: 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:brightness-110',
      action: 'bg-secondary/50 border border-border/40 text-muted-foreground hover:bg-secondary hover:border-primary/40 hover:text-primary transition-colors',
    };

    const sizes = {
      default: 'h-9 px-4 py-2',
      sm: 'h-8 rounded-md px-3 text-xs',
      lg: 'h-10 rounded-md px-8 text-base',
      icon: 'h-9 w-9',
    };

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
