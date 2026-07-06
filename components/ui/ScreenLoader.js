'use client';

/**
 * components/ui/ScreenLoader.js
 * Lightweight full-screen overlay loader with low opacity backdrop.
 * Renders a subtle pulsing diamond (◆) spinner centered on screen.
 *
 * Usage:
 *   import ScreenLoader from '@/components/ui/ScreenLoader'
 *   {loading && <ScreenLoader />}
 *   <ScreenLoader text="Loading scans..." />
 */

export default function ScreenLoader({ text }) {
  return (
    <div className="screen-loader">
      <div className="screen-loader-content">
        <div className="screen-loader-spinner" />
        {text && <p className="screen-loader-text">{text}</p>}
      </div>
    </div>
  );
}
