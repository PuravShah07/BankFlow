import React from "react";

export function Logo({ className = "h-8 w-8" }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="iso-react-grad-top" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#4f46e5" />
          <stop offset="100%" stop-color="#6366f1" />
        </linearGradient>
      </defs>
      {/* Top Face: Balance */}
      <polygon points="50,18 77,33.5 50,49 23,33.5" fill="url(#iso-react-grad-top)" />
      
      {/* Left Face: Debit / Inflow */}
      <polygon points="20,38 47,53.5 47,82 20,66.5" fill="#312e81" />
      
      {/* Right Face: Credit / Outflow */}
      <polygon points="53,53.5 80,38 80,66.5 53,82" fill="#818cf8" />
    </svg>
  );
}
