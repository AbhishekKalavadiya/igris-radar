'use client';

import { useEffect, useState } from 'react';

export default function SecurityGauge({ score = 0, size = 200, showLabel = true, valueSize = "text-5xl" }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  
  useEffect(() => {
    // Animate score from 0 to target
    let current = 0;
    const increment = score / 30;
    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        current = score;
        clearInterval(timer);
      }
      setAnimatedScore(Math.round(current));
    }, 30);
    
    return () => clearInterval(timer);
  }, [score]);

  const getColor = () => {
    if (animatedScore >= 70) return '#3bbcdc'; // Igris teal - Good
    if (animatedScore >= 40) return '#2a9db5'; // Igris teal mid - Fair
    return '#FF4444'; // Red - At Risk
  };

  const getLabel = () => {
    if (animatedScore >= 70) return 'Good';
    if (animatedScore >= 40) return 'Fair';
    return 'At Risk';
  };

  // Calculate progress for the circular arc
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progress = (animatedScore / 100) * circumference;
  const dashOffset = circumference - progress;

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      {/* Background circle */}
      <svg 
        className="absolute transform -rotate-90" 
        width={size} 
        height={size}
        viewBox="0 0 180 180"
      >
        {/* Background track */}
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="12"
        />
        {/* Progress arc */}
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-all duration-500 ease-out"
          style={{
            filter: `drop-shadow(0 0 8px ${getColor()}50)`
          }}
        />
      </svg>
      
      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <span 
          className={`${valueSize} font-bold transition-colors duration-300 leading-none`}
          style={{ color: getColor() }}
        >
          {animatedScore}
        </span>
        {showLabel && <span className="text-sm text-muted-foreground mt-1">{getLabel()}</span>}
      </div>
    </div>
  );
}
