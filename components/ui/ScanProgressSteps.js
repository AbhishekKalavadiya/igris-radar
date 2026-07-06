'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Animated in-progress panel shown while a scan runs. Steps advance on a
 * timer (the API is a single request, so timing is an approximation) and
 * the final step keeps spinning until the parent unmounts this component.
 */
export default function ScanProgressSteps({ steps, accent, stepDuration = 2200 }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (activeIndex >= steps.length - 1) return;
    const timer = setTimeout(() => setActiveIndex((i) => i + 1), stepDuration);
    return () => clearTimeout(timer);
  }, [activeIndex, steps.length, stepDuration]);

  return (
    <Card className="glass-panel rounded-lg overflow-hidden">
      <div className={`h-1 w-full ${accent?.bg || 'bg-primary'} animate-pulse`} />
      <CardContent className="p-6">
        <div className="space-y-3">
          <AnimatePresence>
            {steps.map((step, i) => {
              if (i > activeIndex) return null;
              const done = i < activeIndex;
              return (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-3 text-sm"
                >
                  {done ? (
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                  ) : (
                    <Loader2 className={`h-4 w-4 animate-spin shrink-0 ${accent?.text || 'text-primary'}`} />
                  )}
                  <span className={done ? 'text-muted-foreground' : 'text-foreground font-medium'}>{step}</span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
