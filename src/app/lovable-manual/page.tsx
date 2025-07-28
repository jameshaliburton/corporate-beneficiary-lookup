'use client';

import { ManualInput } from '@/components/ManualInput';
import { AppHeader } from '@/components/AppHeader';

export default function LovableManualPage() {
  return (
    <div className="min-h-screen bg-background dark-gradient">
      <AppHeader />
      <div className="container mx-auto max-w-md px-4 pt-4">
        <div className="text-center mb-8">
          <h1 className="text-headline mb-2">Manual Search Test</h1>
          <p className="text-body text-muted-foreground">Testing the exact Lovable manual input component</p>
        </div>
        
        {/* Manual Search Screen */}
        <div className="space-y-6">
          <ManualInput 
            onSearch={(query) => console.log('Manual search:', query)}
            placeholder="Enter brand or company name..."
          />
        </div>
      </div>
    </div>
  );
} 