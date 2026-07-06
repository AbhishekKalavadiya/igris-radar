'use client';

import { useEffect, useState } from 'react';

export default function WaveformVisual({ isPlaying = false, barCount = 20, height = 40 }) {
  const [bars, setBars] = useState([]);

  useEffect(() => {
    // Generate random bar heights
    const newBars = Array.from({ length: barCount }, () => 
      Math.random() * 0.7 + 0.3
    );
    setBars(newBars);
  }, [barCount]);

  return (
    <div 
      className="flex items-center justify-center gap-[2px]" 
      style={{ height: `${height}px` }}
    >
      {bars.map((barHeight, index) => (
        <div
          key={index}
          className={`w-1 rounded-full transition-all duration-150 ${
            isPlaying ? 'waveform-bar' : ''
          }`}
          style={{
            height: `${barHeight * height}px`,
            animationDelay: `${index * 0.05}s`,
            opacity: isPlaying ? 1 : 0.5,
            backgroundColor: '#3bbcdc',
          }}
        />
      ))}
    </div>
  );
}
