'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle2, Circle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LogoText from '@/components/ui/LogoText';
import LogoIcon from '@/components/ui/LogoIcon';

// Mirrors the server-side password policy in lib/validation/schemas.js
// (strongPassword). Keep the two in sync - the server rejects anything that
// fails these, so surfacing them here prevents a confusing 400 on submit.
const PASSWORD_RULES = [
  { label: 'At least 8 characters',            test: (p) => p.length >= 8 },
  { label: 'One uppercase letter (A–Z)',       test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter (a–z)',       test: (p) => /[a-z]/.test(p) },
  { label: 'One number (0–9)',                 test: (p) => /[0-9]/.test(p) },
  { label: 'One special character (!@#$…)',    test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const passwordRules = PASSWORD_RULES.map((rule) => ({ ...rule, met: rule.test(password) }));
  const allPasswordValid = passwordRules.every((rule) => rule.met);
  const showPasswordRules = passwordFocused || password.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!allPasswordValid) {
      setError('Please choose a password that meets all the requirements below.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/?path=auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (data.success) {
        setDone(true);
        setTimeout(() => router.push('/login'), 2500);
      } else {
        setError(data.error || 'This reset link is invalid or has expired.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 fade-in">
        <Link href="/landing" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <LogoIcon className="h-10 w-10" />
            </div>
          </div>
          <h1 className="flex justify-center text-3xl"><LogoText /></h1>
          <p className="text-muted-foreground mt-2">AI search visibility &amp; web audits</p>
        </div>

        <Card className="border-border">
          {done ? (
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-3 py-4">
                <div className="h-12 w-12 rounded-pill bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                </div>
                <h2 className="text-lg font-bold">Password reset</h2>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Your password has been changed. Redirecting you to sign in...
                </p>
              </div>
            </CardContent>
          ) : !token ? (
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-3 py-4">
                <div className="h-12 w-12 rounded-pill bg-destructive/10 flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-destructive" />
                </div>
                <h2 className="text-lg font-bold">Invalid reset link</h2>
                <p className="text-sm text-muted-foreground max-w-sm">
                  This link is missing its reset token. Request a new one below.
                </p>
              </div>
              <div className="mt-4 text-center text-sm">
                <Link href="/forgot-password" className="text-primary hover:underline font-medium">
                  Request a new reset link
                </Link>
              </div>
            </CardContent>
          ) : (
            <>
              <CardHeader>
                <CardTitle>Choose a new password</CardTitle>
                <CardDescription>Enter a strong new password for your account</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="reset-password" className="text-sm font-medium">New password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="reset-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                        aria-describedby="password-requirements"
                        className="pl-10 pr-10"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-md text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {showPasswordRules && (
                      <ul id="password-requirements" className="mt-2 space-y-1.5" aria-label="Password requirements">
                        {passwordRules.map((rule) => (
                          <li key={rule.label} className="flex items-center gap-2 text-xs transition-colors">
                            {rule.met ? (
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                            ) : (
                              <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            )}
                            <span className={rule.met ? 'text-success' : 'text-muted-foreground'}>{rule.label}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Resetting...' : 'Reset password'}
                  </Button>
                </form>

                <div className="mt-6 text-center text-sm">
                  <Link href="/login" className="text-primary hover:underline font-medium">
                    Back to sign in
                  </Link>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </main>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
