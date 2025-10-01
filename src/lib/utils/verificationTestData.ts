/**
 * Test data for verification components
 */

export const verificationTestData = {
  confirmed: {
    status: "confirmed" as const,
    confidenceChange: "increased" as const,
    method: "Gemini AI Verification",
    verifiedAt: new Date().toISOString(),
    notes: "Ownership verified through multiple sources",
    verification_evidence: {
      supporting_evidence: ["Corporate filings", "Official website"],
      missing_evidence: [],
      contradicting_evidence: []
    }
  },
  insufficient: {
    status: "insufficient_evidence" as const,
    confidenceChange: "unchanged" as const,
    method: "Web Search Analysis",
    verifiedAt: new Date().toISOString(),
    notes: "Limited information available",
    verification_evidence: {
      supporting_evidence: [],
      missing_evidence: ["Corporate structure", "Ownership details"],
      contradicting_evidence: []
    }
  },
  contradicted: {
    status: "contradicted" as const,
    confidenceChange: "decreased" as const,
    method: "Fact-Checking",
    verifiedAt: new Date().toISOString(),
    notes: "Conflicting information found",
    verification_evidence: {
      supporting_evidence: [],
      missing_evidence: [],
      contradicting_evidence: ["Public records", "News reports"]
    }
  },
  mixed: {
    status: "mixed_evidence" as const,
    confidenceChange: "unchanged" as const,
    method: "Multi-Source Analysis",
    verifiedAt: new Date().toISOString(),
    notes: "Some sources support, others contradict",
    verification_evidence: {
      supporting_evidence: ["Some filings"],
      missing_evidence: ["Complete structure"],
      contradicting_evidence: ["Alternative claims"]
    }
  }
};
