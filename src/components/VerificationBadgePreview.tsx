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
            <VerificationBadge status="confirmed" />
          </div>
                      <VerificationDetailsPanel
              status="confirmed"
              evidence={verificationTestData.confirmed.verification_evidence}
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
            <VerificationBadge status="contradicted" />
          </div>
                      <VerificationDetailsPanel
              status="contradicted"
              evidence={verificationTestData.contradicted.verification_evidence}
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
            <VerificationBadge status="mixed_evidence" />
          </div>
                      <VerificationDetailsPanel
              status="mixed_evidence"
              evidence={verificationTestData.mixed_evidence.verification_evidence}
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
            <VerificationBadge status="insufficient_evidence" />
          </div>
                      <VerificationDetailsPanel
              status="insufficient_evidence"
              evidence={verificationTestData.insufficient_evidence.verification_evidence}
            />
        </CardContent>
      </Card>

      {/* Badge Design System */}
      <Card>
        <CardHeader>
          <CardTitle>Badge Design System</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <VerificationBadge status="confirmed" />
              <p className="text-sm text-gray-600 mt-2">Green • Verified</p>
            </div>
            <div className="text-center">
              <VerificationBadge status="contradicted" />
              <p className="text-sm text-gray-600 mt-2">Blue • Contradicted</p>
            </div>
            <div className="text-center">
              <VerificationBadge status="mixed_evidence" />
              <p className="text-sm text-gray-600 mt-2">Blue • Mixed</p>
            </div>
            <div className="text-center">
              <VerificationBadge status="insufficient_evidence" />
              <p className="text-sm text-gray-600 mt-2">Gray • Insufficient</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lovable Design System */}
      <Card>
        <CardHeader>
          <CardTitle>Lovable Design System Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <VerificationBadge status="confirmed" />
              <span className="text-sm text-gray-600">Clean pill design with rounded-full</span>
            </div>
            <div className="flex items-center gap-4">
              <VerificationBadge status="contradicted" />
              <span className="text-sm text-gray-600">Consistent text-xs font-medium</span>
            </div>
            <div className="flex items-center gap-4">
              <VerificationBadge status="mixed_evidence" />
              <span className="text-sm text-gray-600">Proper spacing with gap-1.5</span>
            </div>
            <div className="flex items-center gap-4">
              <VerificationBadge status="insufficient_evidence" />
              <span className="text-sm text-gray-600">Border-0 for clean appearance</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
