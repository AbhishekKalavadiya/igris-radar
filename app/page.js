'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/authContext';

function HomeContent() {
  const { user, loading, isOnboarded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user && isOnboarded) {
        router.push('/dashboard');
      } else if (user && !isOnboarded) {
        router.push('/onboarding');
      } else {
        router.push('/landing');
      }
    }
  }, [user, loading, isOnboarded, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <HomeContent />
    </AuthProvider>
  );
}
