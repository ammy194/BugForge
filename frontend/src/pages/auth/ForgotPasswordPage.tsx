import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Bug, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await resetPassword(email);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="w-full max-w-md space-y-6 z-10">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 shadow-xl shadow-indigo-500/25 text-white">
            <Bug className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Reset Password</h1>
          <p className="text-xs text-muted-foreground">
            We will send a password reset link to your email
          </p>
        </div>

        <Card className="border-border/80 bg-card/70 backdrop-blur-xl shadow-2xl">
          <CardContent className="pt-6 space-y-4">
            {submitted ? (
              <div className="text-center space-y-3 py-4">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Check your inbox</h3>
                <p className="text-xs text-muted-foreground">
                  If an account exists for <strong className="text-foreground">{email}</strong>, you will receive password reset instructions.
                </p>
                <NavLink to="/login">
                  <Button variant="outline" size="sm" className="mt-2 text-xs">
                    Back to Sign In
                  </Button>
                </NavLink>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                    {error}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Email Address</label>
                  <Input
                    type="email"
                    placeholder="name@company.com"
                    icon={<Mail className="h-4 w-4 text-muted-foreground" />}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <Button
                  type="submit"
                  variant="glow"
                  className="w-full text-xs font-semibold h-9"
                  disabled={loading}
                >
                  {loading ? 'Sending link...' : 'Send Reset Link'}
                </Button>

                <div className="text-center">
                  <NavLink
                    to="/login"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Back to Sign In</span>
                  </NavLink>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
