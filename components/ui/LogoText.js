import React from 'react';

export default function LogoText({ className = "text-lg tracking-tight" }) {
  return (
    <span className={`${className} flex items-center`}>
      <span className="font-extrabold text-foreground">Igris</span>
      <span className="font-normal text-primary ml-1">Radar</span>
    </span>
  );
}
