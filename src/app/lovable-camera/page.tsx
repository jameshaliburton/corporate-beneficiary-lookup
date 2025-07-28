'use client';

import { VideoCapture } from '@/components/VideoCapture';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/AppHeader';

export default function LovableCameraPage() {
  return (
    <div className="min-h-screen bg-background dark-gradient">
      <AppHeader />
      <div className="container mx-auto max-w-md px-4 pt-4">
        <div className="text-center mb-8">
          <h1 className="text-headline mb-2">Camera Test</h1>
          <p className="text-body text-muted-foreground">Testing the exact Lovable camera components</p>
        </div>
        
        {/* Camera/Scan Entry Screen */}
        <div className="space-y-6">
          {/* Video Capture Component */}
          <div className="relative">
            <VideoCapture 
              onCapture={() => console.log('Capture triggered')}
              isScanning={false}
            />
          </div>
          
          {/* Manual Search Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => console.log('Go to manual search')}
              className="text-small h-btn-primary rounded-component"
              size="sm"
            >
              Search by name instead
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 