import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Bug, Lock, CheckCircle2 } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
      }
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="w-full max-w-md space-y-6 z-10">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-xl shadow-primary/25 text-white">
            <Bug className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Set New Password</h1>
        </div>

        <Card className="border-border/80 bg-card/70 backdrop-blur-xl shadow-2xl">
          <CardContent className="pt-6 space-y-4">
            {success ? (
              <div className="text-center space-y-3 py-4">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Password Updated</h3>
                <p className="text-xs text-muted-foreground">Redirecting you to login...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                    {error}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">New Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    icon={<Lock className="h-4 w-4 text-muted-foreground" />}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Confirm New Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    icon={<Lock className="h-4 w-4 text-muted-foreground" />}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <Button
                  type="submit"
                  variant="glow"
                  className="w-full text-xs font-semibold h-9"
                  disabled={loading}
                >
                  {loading ? 'Updating Password...' : 'Save New Password'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
