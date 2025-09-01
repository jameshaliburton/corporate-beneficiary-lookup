"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VerificationBadge } from './VerificationBadge';
import { VerificationDetailsPanel } from './VerificationDetailsPanel';
import { verificationTestData } from '@/lib/utils/verificationTestData';

export const VerificationBadgePreview: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Verification Badge System</h1>
        <p className="text-gray-600">Complete overview of all verification states and their UI components</p>
      </div>

      {/* ✅ CONFIRMED */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-green-600">✅</span>
            Confirmed - "Verified by AI"
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <VerificationBadge
              status="confirmed"
              confidenceChange="increased"
            />
          </div>
          <VerificationDetailsPanel
            status="confirmed"
            evidence={verificationTestData.confirmed.verification_evidence}
            confidenceChange="increased"
          />
        </CardContent>
      </Card>

      {/* ⚠️ CONTRADICTED */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-blue-600">⚠️</span>
            Contradicted - "Contradictory evidence"
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <VerificationBadge
              status="contradicted"
              confidenceChange="decreased"
            />
          </div>
          <VerificationDetailsPanel
            status="contradicted"
            evidence={verificationTestData.contradicted.verification_evidence}
            confidenceChange="decreased"
          />
        </CardContent>
      </Card>

      {/* ⚖️ MIXED EVIDENCE */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-blue-600">⚖️</span>
            Mixed Evidence - "Conflicting sources"
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <VerificationBadge
              status="mixed_evidence"
              confidenceChange="unchanged"
            />
          </div>
          <VerificationDetailsPanel
            status="mixed_evidence"
            evidence={verificationTestData.mixed_evidence.verification_evidence}
            confidenceChange="unchanged"
          />
        </CardContent>
      </Card>

      {/* ❓ INSUFFICIENT EVIDENCE */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-gray-600">❓</span>
            Insufficient Evidence - "Not enough info"
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <VerificationBadge
              status="insufficient_evidence"
              confidenceChange="unchanged"
            />
          </div>
          <VerificationDetailsPanel
            status="insufficient_evidence"
            evidence={verificationTestData.insufficient_evidence.verification_evidence}
            confidenceChange="unchanged"
          />
        </CardContent>
      </Card>

      {/* Confidence Change Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Confidence Change Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <VerificationBadge
                status="confirmed"
                confidenceChange="increased"
              />
              <p className="text-sm text-gray-600 mt-2">Increased</p>
            </div>
            <div className="text-center">
              <VerificationBadge
                status="contradicted"
                confidenceChange="decreased"
              />
              <p className="text-sm text-gray-600 mt-2">Decreased</p>
            </div>
            <div className="text-center">
              <VerificationBadge
                status="mixed_evidence"
                confidenceChange="unchanged"
              />
              <p className="text-sm text-gray-600 mt-2">Unchanged</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Responsive Test */}
      <Card>
        <CardHeader>
          <CardTitle>Mobile Responsive Layout</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 bg-gray-50">
            <p className="text-sm text-gray-600 mb-4">
              On mobile devices, confidence change text is hidden and only icons are shown.
            </p>
            <div className="flex justify-center">
              <VerificationBadge
                status="confirmed"
                confidenceChange="increased"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
