'use client';

import { LoadingScreen } from '@/components/LoadingScreen';
import { AppHeader } from '@/components/AppHeader';

export default function LovableLoadingPage() {
  return (
    <div className="min-h-screen bg-background dark-gradient">
      <AppHeader />
      <div className="container mx-auto max-w-md px-4 pt-4">
        <div className="text-center mb-8">
          <h1 className="text-headline mb-2">Loading Test</h1>
          <p className="text-body text-muted-foreground">Testing the exact Lovable loading component</p>
        </div>
        
        {/* Loading Screen */}
        <div className="space-y-6">
          <LoadingScreen />
        </div>
      </div>
    </div>
  );
} 