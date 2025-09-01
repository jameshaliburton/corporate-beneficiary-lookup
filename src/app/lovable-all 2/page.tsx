'use client';

import { ProductResult } from '@/components/ProductResult';
import { VideoCapture } from '@/components/VideoCapture';
import { ScanButton } from '@/components/ScanButton';
import { ManualInput } from '@/components/ManualInput';
import { LoadingScreen } from '@/components/LoadingScreen';
import { FailedScanResult } from '@/components/FailedScanResult';
import { LowConfidenceResult } from '@/components/LowConfidenceResult';
import { ShareModal } from '@/components/ShareModal';
import { AppHeader } from '@/components/AppHeader';
import { useState } from 'react';

export default function LovableAllPage() {
  const [showShareModal, setShowShareModal] = useState(false);

  const sampleData = {
    brand: "L'Oréal Paris",
    owner: "L'Oréal Group",
    confidence: 95,
    productImage: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'%3E%3Crect width='128' height='128' fill='%23FF6B6B'/%3E%3Ctext x='64' y='64' font-family='Arial' font-size='16' fill='white' text-anchor='middle' dy='.3em'%3EL'Oreal%3C/text%3E%3C/svg%3E",
    ownershipChain: [
      {
        name: "L'Oréal Paris",
        country: "France",
        countryFlag: "🇫🇷",
        avatar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 44 44'%3E%3Crect width='44' height='44' fill='%23FF6B6B'/%3E%3Ctext x='22' y='22' font-family='Arial' font-size='10' fill='white' text-anchor='middle' dy='.3em'%3EL'Oreal%3C/text%3E%3C/svg%3E"
      },
      {
        name: "L'Oréal Group",
        country: "France",
        countryFlag: "🇫🇷",
        avatar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 44 44'%3E%3Crect width='44' height='44' fill='%234ECDC4'/%3E%3Ctext x='22' y='22' font-family='Arial' font-size='10' fill='white' text-anchor='middle' dy='.3em'%3EGroup%3C/text%3E%3C/svg%3E"
      }
    ],
    structureType: "Public Company",
    acquisitionYear: 1909,
    publicTicker: "OR.PA"
  };

  return (
    <div className="min-h-screen bg-background dark-gradient">
      <AppHeader />
      <div className="container mx-auto max-w-md px-4 pt-4">
        <div className="text-center mb-8">
          <h1 className="text-headline mb-2">All Lovable Screens</h1>
          <p className="text-body text-muted-foreground">Testing all exact Lovable components</p>
        </div>
        
        {/* All Screens */}
        <div className="space-y-12">
          
          {/* 1. Camera/Scan Entry Screen */}
          <div>
            <h2 className="text-subheadline mb-6 text-center">📸 Camera/Scan Entry</h2>
            <div className="space-y-6">
              <VideoCapture 
                onCapture={() => console.log('Capture triggered')}
                isScanning={false}
              />
              <div className="flex justify-center">
                <ScanButton 
                  onClick={() => console.log('Scan triggered')}
                  isScanning={false}
                />
              </div>
            </div>
          </div>

          {/* 2. Manual Search Screen */}
          <div>
            <h2 className="text-subheadline mb-6 text-center">🔍 Manual Search</h2>
            <ManualInput 
              onSearch={(query) => console.log('Manual search:', query)}
              placeholder="Enter brand or company name..."
            />
          </div>

          {/* 3. Loading Screen */}
          <div>
            <h2 className="text-subheadline mb-6 text-center">⏳ Loading Screen</h2>
            <LoadingScreen />
          </div>

          {/* 4. Results Screen */}
          <div>
            <h2 className="text-subheadline mb-6 text-center">✅ Results Screen</h2>
            <ProductResult {...sampleData} />
          </div>

          {/* 5. Error States */}
          <div>
            <h2 className="text-subheadline mb-6 text-center">⚠️ Error States</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-body font-medium mb-3 text-center">Failed Scan</h3>
                <FailedScanResult 
                  onTryAgain={() => console.log('Retry scan')}
                  onEnterManually={() => console.log('Manual input')}
                />
              </div>
              <div>
                <h3 className="text-body font-medium mb-3 text-center">Low Confidence</h3>
                <LowConfidenceResult 
                  brandName="Unknown Brand"
                  onRetrycan={() => console.log('Retry analysis')}
                  onSearchManually={() => console.log('Manual input')}
                />
              </div>
            </div>
          </div>

          {/* 6. Share Modal Trigger */}
          <div>
            <h2 className="text-subheadline mb-6 text-center">🔗 Share Modal</h2>
            <button 
              onClick={() => setShowShareModal(true)}
              className="w-full h-[52px] bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary-hover transition-colors"
            >
              Open Share Modal
            </button>
          </div>
          
        </div>
        
        {/* Share Modal */}
        {showShareModal && (
          <ShareModal 
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            {...sampleData}
          />
        )}
      </div>
    </div>
  );
} 