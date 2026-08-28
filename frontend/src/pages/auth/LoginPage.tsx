import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, DEMO_PERSONAS } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Bug, Mail, Lock, Sparkles, ArrowRight, Shield, Check } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginWithPassword, loginAsDemoPersona } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await loginWithPassword(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (roleKey: 'admin' | 'pm' | 'dev' | 'reporter') => {
    loginAsDemoPersona(roleKey);
    navigate(from, { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md space-y-6 z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 shadow-xl shadow-indigo-500/25 text-white">
            <Bug className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome to BugForge</h1>
          <p className="text-xs text-muted-foreground">
            Modern developer issue tracking & AI-assisted triage platform
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-border/80 bg-card/70 backdrop-blur-xl shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Sign In</CardTitle>
            <CardDescription className="text-xs">
              Enter your credentials to access your engineering workspace.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Email Address</label>
                <Input
                  type="email"
                  placeholder="name@company.com"
                  icon={<Mail className="h-4 w-4" />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-foreground">Password</label>
                  <NavLink
                    to="/forgot-password"
                    className="text-[11px] text-primary hover:underline"
                  >
                    Forgot password?
                  </NavLink>
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  icon={<Lock className="h-4 w-4" />}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-xs"
                />
              </div>

              <Button
                type="submit"
                variant="glow"
                className="w-full text-xs font-semibold h-9 mt-2"
                disabled={loading}
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </Button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/60"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-card px-2 text-muted-foreground font-mono">
                  Or 1-Click Demo Personas
                </span>
              </div>
            </div>

            {/* Quick Demo Persona Switcher (Crucial for Evaluation & Demo) */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('admin')}
                className="flex items-center justify-between rounded-lg border border-purple-500/30 bg-purple-500/10 p-2 text-left hover:bg-purple-500/20 transition-all text-xs"
              >
                <div>
                  <div className="font-semibold text-foreground">Alex (Admin)</div>
                  <div className="text-[10px] text-purple-400 font-mono">Full Access</div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-purple-400" />
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('pm')}
                className="flex items-center justify-between rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-2 text-left hover:bg-indigo-500/20 transition-all text-xs"
              >
                <div>
                  <div className="font-semibold text-foreground">Sarah (PM)</div>
                  <div className="text-[10px] text-indigo-400 font-mono">Triage & Releases</div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-indigo-400" />
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('dev')}
                className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-left hover:bg-emerald-500/20 transition-all text-xs"
              >
                <div>
                  <div className="font-semibold text-foreground">Bob (Developer)</div>
                  <div className="text-[10px] text-emerald-400 font-mono">Code & PRs</div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-emerald-400" />
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('reporter')}
                className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-left hover:bg-amber-500/20 transition-all text-xs"
              >
                <div>
                  <div className="font-semibold text-foreground">Elena (QA)</div>
                  <div className="text-[10px] text-amber-400 font-mono">Bug Reporter</div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-amber-400" />
              </button>
            </div>

            <div className="text-center text-xs text-muted-foreground pt-2">
              Don't have an account?{' '}
              <NavLink to="/register" className="font-semibold text-primary hover:underline">
                Create account
              </NavLink>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
