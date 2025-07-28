'use client';

import { FailedScanResult } from '@/components/FailedScanResult';
import { LowConfidenceResult } from '@/components/LowConfidenceResult';
import { AppHeader } from '@/components/AppHeader';

export default function LovableErrorPage() {
  return (
    <div className="min-h-screen bg-background dark-gradient">
      <AppHeader />
      <div className="container mx-auto max-w-md px-4 pt-4">
        <div className="text-center mb-8">
          <h1 className="text-headline mb-2">Error States Test</h1>
          <p className="text-body text-muted-foreground">Testing the exact Lovable error components</p>
        </div>
        
        {/* Error States */}
        <div className="space-y-8">
          {/* Failed Scan Result */}
          <div>
            <h2 className="text-subheadline mb-4 text-center">Failed Scan</h2>
            <FailedScanResult 
              onTryAgain={() => console.log('Retry scan')}
              onEnterManually={() => console.log('Manual input')}
            />
          </div>
          
          {/* Low Confidence Result */}
          <div>
            <h2 className="text-subheadline mb-4 text-center">Low Confidence</h2>
            <LowConfidenceResult 
              brandName="Unknown Brand"
              onRetrycan={() => console.log('Retry analysis')}
              onSearchManually={() => console.log('Manual input')}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 