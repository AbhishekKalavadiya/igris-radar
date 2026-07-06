'use client';

import FeaturePageTemplate from '@/components/landing/FeaturePageTemplate';
import { FEATURE_PAGES } from '@/lib/landingContent';

export default function FeaturePage() {
  return <FeaturePageTemplate config={FEATURE_PAGES['brand-visibility']} />;
}
