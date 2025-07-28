'use client';

import { ShareModal } from '@/components/ShareModal';
import { AppHeader } from '@/components/AppHeader';
import { useState } from 'react';

export default function LovableSharePage() {
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
          <h1 className="text-headline mb-2">Share Modal Test</h1>
          <p className="text-body text-muted-foreground">Testing the exact Lovable share modal component</p>
        </div>
        
        {/* Share Modal Trigger */}
        <div className="space-y-6">
          <button 
            onClick={() => setShowShareModal(true)}
            className="w-full h-[52px] bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary-hover transition-colors"
          >
            Open Share Modal
          </button>
          
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
    </div>
  );
} 