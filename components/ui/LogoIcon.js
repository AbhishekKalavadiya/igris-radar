import React from 'react';

export default function LogoIcon({ className = "w-6 h-6", ...props }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className} 
      {...props}
    >
      {/* Outer Eye Shape */}
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" className="stroke-primary" />
      
      {/* Inner Radar Rings (Iris) */}
      <circle cx="12" cy="12" r="4" className="stroke-foreground opacity-80" />
      <circle cx="12" cy="12" r="1.5" className="fill-foreground stroke-foreground" />
      
      {/* Radar Sweep / Crosshair Element */}
      <path d="M12 8v2" className="stroke-primary" />
      <path d="M12 14v2" className="stroke-primary" />
      <path d="M8 12h2" className="stroke-primary" />
      <path d="M14 12h2" className="stroke-primary" />
    </svg>
  );
}
