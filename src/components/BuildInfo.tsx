'use client';

import React, { useState } from 'react';
import { getDisplayBuildNumber, getShortBuildNumber, getFullBuildInfo, isProduction } from '@/lib/build-info';

interface BuildInfoProps {
  variant?: 'compact' | 'full' | 'debug';
  position?: 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left';
  showOnHover?: boolean;
  className?: string;
}

export default function BuildInfo({ 
  variant = 'compact', 
  position = 'bottom-right',
  showOnHover = false,
  className = ''
}: BuildInfoProps) {
  const [isHovered, setIsHovered] = useState(false);

  const positionClasses = {
    'top-right': 'top-2 right-2',
    'bottom-right': 'bottom-2 right-2',
    'bottom-left': 'bottom-2 left-2',
    'top-left': 'top-2 left-2'
  };

  const baseClasses = `fixed z-50 text-xs font-mono ${positionClasses[position]} ${className}`;

  if (variant === 'compact') {
    return (
      <div 
        className={`${baseClasses} bg-black/80 text-white px-2 py-1 rounded shadow-lg`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {showOnHover && isHovered ? getDisplayBuildNumber() : getShortBuildNumber()}
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div 
        className={`${baseClasses} bg-black/90 text-white px-3 py-2 rounded-lg shadow-lg max-w-xs`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="font-semibold text-white/90">Build Info</div>
        <div className="text-white/80 mt-1">{getDisplayBuildNumber()}</div>
        {isHovered && (
          <div className="text-white/70 mt-1 text-xs">
            {isProduction() ? 'Production' : 'Development'}
          </div>
        )}
      </div>
    );
  }

  if (variant === 'debug') {
    const buildInfo = getFullBuildInfo();
    
    return (
      <div className={`${baseClasses} bg-black/95 text-white p-3 rounded-lg shadow-lg max-w-sm`}>
        <div className="font-semibold text-white/90 mb-2">Debug Build Info</div>
        <div className="space-y-1 text-xs text-white/80">
          <div><span className="text-white/60">Version:</span> {buildInfo.version}</div>
          <div><span className="text-white/60">Build:</span> {buildInfo.buildNumber}</div>
          <div><span className="text-white/60">Date:</span> {new Date(buildInfo.buildDate).toLocaleString()}</div>
          <div><span className="text-white/60">Env:</span> {buildInfo.environment}</div>
          <div><span className="text-white/60">Commit:</span> {buildInfo.git.commit}</div>
          <div><span className="text-white/60">Branch:</span> {buildInfo.git.branch}</div>
        </div>
      </div>
    );
  }

  return null;
}

// Inline build info for embedding in other components
export function InlineBuildInfo({ variant = 'compact', className = '' }: Omit<BuildInfoProps, 'position' | 'showOnHover'>) {
  if (variant === 'compact') {
    return (
      <span className={`text-xs font-mono text-gray-500 ${className}`}>
        {getShortBuildNumber()}
      </span>
    );
  }

  if (variant === 'full') {
    return (
      <span className={`text-xs font-mono text-gray-600 ${className}`}>
        {getDisplayBuildNumber()}
      </span>
    );
  }

  return null;
} 