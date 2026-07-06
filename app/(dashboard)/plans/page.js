'use client';

import { useAuth } from '@/lib/authContext';
import { CreditCard } from 'lucide-react';
import BillingTab from '@/components/settings/BillingTab';
import PageHeader from '@/components/ui/PageHeader';
import { PageTransition } from '@/components/ui/motion';

export default function PlansPage() {
  const { user } = useAuth();

  return (
    <PageTransition className="space-y-6 max-w-5xl">
      <PageHeader
        icon={CreditCard}
        title="Plans & Billing"
        description="Manage your subscription and billing details."
      />

      <BillingTab currentPlan={user?.plan || 'free'} />
    </PageTransition>
  );
}
