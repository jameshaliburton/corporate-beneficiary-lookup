"use client";

import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background dark-gradient">
      <div className="container mx-auto max-w-md px-4 pt-4">
        <AppHeader />
        
        <div className="mt-8 space-y-6">
          {/* Back Button */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          
          {/* Content */}
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h1 className="text-2xl font-bold text-foreground">
                About OwnedBy
              </h1>
              <p className="text-muted-foreground">
                Discover who owns the products you use every day
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="glass rounded-3xl p-6 space-y-4">
                <h2 className="text-lg font-semibold text-foreground">
                  How it works
                </h2>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    Simply scan any product with your camera or search by name to instantly reveal the corporate ownership behind it.
                  </p>
                  <p>
                    Our AI analyzes product packaging, brand information, and corporate databases to trace the ownership chain from brand to ultimate parent company.
                  </p>
                </div>
              </div>
              
              <div className="glass rounded-3xl p-6 space-y-4">
                <h2 className="text-lg font-semibold text-foreground">
                  What you'll discover
                </h2>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    • The ultimate parent company that owns the brand
                  </p>
                  <p>
                    • The ownership structure and corporate hierarchy
                  </p>
                  <p>
                    • The country where the parent company is headquartered
                  </p>
                  <p>
                    • Confidence scores for our analysis accuracy
                  </p>
                </div>
              </div>
              
              <div className="glass rounded-3xl p-6 space-y-4">
                <h2 className="text-lg font-semibold text-foreground">
                  Privacy & Data
                </h2>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    We don't store your photos or personal information. Product scans are processed anonymously and discarded immediately.
                  </p>
                  <p>
                    Our ownership data comes from public corporate filings, annual reports, and verified business databases.
                  </p>
                </div>
              </div>
              
              <div className="glass rounded-3xl p-6 space-y-4">
                <h2 className="text-lg font-semibold text-foreground">
                  Beta Version
                </h2>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    This is a beta version of OwnedBy. We're continuously improving our AI analysis and expanding our database of corporate ownership information.
                  </p>
                  <p>
                    Results may not be 100% accurate for all products, especially for smaller brands or complex corporate structures.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 