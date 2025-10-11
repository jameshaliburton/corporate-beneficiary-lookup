'use client';

import { useEffect, useState } from 'react';
import { isStagingEnv, getEnvironment } from '@/lib/utils/environment';

/**
 * Staging Environment Banner
 * 
 * Shows a subtle banner at the top of the page when running in staging mode.
 * Only visible in staging environment.
 */
export function StagingBanner() {
  const [isStaging, setIsStaging] = useState(false);
  const [environment, setEnvironment] = useState<string>('');

  useEffect(() => {
    const staging = isStagingEnv();
    const env = getEnvironment();
    
    setIsStaging(staging);
    setEnvironment(env);
    
    if (staging) {
      console.log('🧪 [STAGING MODE] Running in staging environment');
      console.log('🧪 [STAGING MODE] Database writes may be disabled');
      console.log('🧪 [STAGING MODE] Analytics disabled');
    }
  }, []);

  if (!isStaging) {
    return null;
  }

  return (
    <div className="bg-yellow-500/90 text-yellow-950 px-4 py-2 text-center text-sm font-medium border-b border-yellow-600/50 backdrop-blur-sm">
      <div className="flex items-center justify-center gap-2">
        <span className="text-lg">🧪</span>
        <span>STAGING ENVIRONMENT</span>
        <span className="text-xs opacity-75">({environment})</span>
        <span className="text-lg">🧪</span>
      </div>
    </div>
  );
}

