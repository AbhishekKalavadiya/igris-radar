'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, CheckCircle2, Circle } from 'lucide-react';
import { AuthProvider, useAuth } from '@/lib/authContext';
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

function SignupForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const router = useRouter();

  const passwordRules = PASSWORD_RULES.map((rule) => ({ ...rule, met: rule.test(password) }));
  const allPasswordValid = passwordRules.every((rule) => rule.met);
  const showPasswordRules = passwordFocused || password.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password || !name) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (!allPasswordValid) {
      setError('Please choose a password that meets all the requirements below.');
      setLoading(false);
      return;
    }

    const result = await signup(email, password, name);
    if (result.success) {
      router.push('/onboarding');
    } else {
      setError(result.error || 'Signup failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 fade-in">
        <Link href="/landing" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        {/* Logo */}
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
          <CardHeader>
            <CardTitle>Create your account</CardTitle>
            <CardDescription>Start protecting your content today</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="signup-name" className="text-sm font-medium">Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="signup-email" className="text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="signup-password" className="text-sm font-medium">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    aria-describedby="password-requirements"
                    className="pl-10 pr-10"
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
                {loading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to our{' '}
          <Link href="/landing/terms" className="text-primary hover:underline">Terms of Service</Link>
          {' '}and{' '}
          <Link href="/landing/privacy" className="text-primary hover:underline">Privacy Policy</Link>
        </p>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <AuthProvider>
      <SignupForm />
    </AuthProvider>
  );
}
