'use client';

import { motion, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';

/** Shared motion configs - one spring, one ease, used app-wide */
export const SPRING = { type: 'spring', stiffness: 260, damping: 28 };
export const EASE = [0.2, 0, 0, 1];

/** Page-level entrance: fade + rise. Wrap the page's root div content. */
export function PageTransition({ children, className }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Container that staggers its MotionItem children in. */
export function Stagger({ children, className, delay = 0 }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : 'hidden'}
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.07, delayChildren: delay } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function MotionItem({ children, className }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 16 },
        show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
      }}
    >
      {children}
    </motion.div>
  );
}

/** Scroll-triggered reveal: fades + rises when the element enters the viewport. */
export function Reveal({ children, className, delay = 0, y = 24 }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Number that springs from 0 to its value - for stats and scores. */
export function AnimatedNumber({ value, className, ...props }) {
  const reduce = useReducedMotion();
  const spring = useSpring(0, { stiffness: 80, damping: 20 });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString());

  useEffect(() => {
    if (reduce) {
      spring.jump(value ?? 0);
    } else {
      spring.set(value ?? 0);
    }
  }, [value, spring, reduce]);

  return <motion.span className={`tabular-nums ${className || ''}`} {...props}>{display}</motion.span>;
}
