import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { GlobalRole } from '../../types';
import { Bug, Mail, Lock, User, Shield } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { registerWithPassword } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<GlobalRole>('DEVELOPER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setError('Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await registerWithPassword(email, password, fullName, role);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md space-y-6 z-10">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-xl shadow-primary/25 text-white">
            <Bug className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Create your account</h1>
          <p className="text-xs text-muted-foreground">
            Join your software engineering team on BugForge
          </p>
        </div>

        <Card className="border-border/80 bg-card/70 backdrop-blur-xl shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Sign Up</CardTitle>
            <CardDescription className="text-xs">
              Fill out the details below to initialize your profile.
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
                <label className="text-xs font-medium text-foreground">Full Name</label>
                <Input
                  type="text"
                  placeholder="Alex Martin"
                  icon={<User className="h-4 w-4 text-muted-foreground" />}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Work Email</label>
                <Input
                  type="email"
                  placeholder="alex@company.com"
                  icon={<Mail className="h-4 w-4 text-muted-foreground" />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Password</label>
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
                <label className="text-xs font-medium text-foreground">Primary Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as GlobalRole)}
                  className="flex h-9 w-full rounded-md border border-input bg-secondary/50 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="DEVELOPER">Developer (Code, PRs, Fixes)</option>
                  <option value="PROJECT_MANAGER">Project Manager (Releases, Triage, Sprints)</option>
                  <option value="REPORTER">QA Engineer / Reporter (Testing, Bug Reports)</option>
                  <option value="ADMIN">System Administrator</option>
                </select>
              </div>

              <Button
                type="submit"
                variant="glow"
                className="w-full text-xs font-semibold h-9 mt-3"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Button>
            </form>

            <div className="text-center text-xs text-muted-foreground pt-2">
              Already have an account?{' '}
              <NavLink to="/login" className="font-semibold text-primary hover:underline">
                Sign In
              </NavLink>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
