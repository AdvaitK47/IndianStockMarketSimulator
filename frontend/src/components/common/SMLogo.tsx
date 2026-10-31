import React from 'react';

interface SMLogoProps {
  className?: string;
  size?: number;
}

export const SMLogo: React.FC<SMLogoProps> = ({ className = 'w-10 h-10', size = 40 }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      fill="none"
    >
      <defs>
        <linearGradient id="smArrowGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="65%" stopColor="#ffffff" />
          <stop offset="85%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
        <filter id="smGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#10b981" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Matte Black Base */}
      <rect width="100" height="100" rx="22" fill="#09090b" />
      <rect width="98" height="98" x="1" y="1" rx="21" fill="none" stroke="#27272a" strokeWidth="1.5" />

      {/* Letter S - sleek trading curve */}
      <path
        d="M 37 31 C 34 26 23 26 20 31 C 17 36 19 43 25 46 L 31 49 C 38 52 40 60 37 66 C 34 71 23 72 18 67"
        fill="none"
        stroke="#ffffff"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Letter M with right leg dipping down and surging UP */}
      <path
        d="M 46 68 L 46 30 L 57 50 L 68 30 L 78 62 L 88 32"
        fill="none"
        stroke="url(#smArrowGrad)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Arrowhead on the rising end of M */}
      <path
        d="M 77 30 L 89 31 L 88 43"
        fill="none"
        stroke="#34d399"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#smGlow)"
      />
    </svg>
  );
};