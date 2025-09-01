/**
 * Sample test data for verification badge system
 */

export const verificationTestData = {
  // ✅ CONFIRMED - Purina example
  confirmed: {
    verification_status: "confirmed",
    verification_confidence_change: "increased",
    verification_evidence: {
      supporting_evidence: [
        "Result 1 explicitly states Purina is a subsidiary of Nestlé S.A.",
        "Result 2 confirms Nestlé owns and operates Purina as part of its pet care division",
        "Result 3 mentions the 2001 acquisition for $10.3 billion"
      ],
      contradicting_evidence: [],
      neutral_evidence: [
        "General information about pet food industry"
      ],
      missing_evidence: [],
      summary: "Web evidence strongly confirms that Purina is owned by Nestlé S.A."
    }
  },

  // ⚠️ CONTRADICTED - Hövding example
  contradicted: {
    verification_status: "contradicted",
    verification_confidence_change: "decreased",
    verification_evidence: {
      supporting_evidence: [
        "Result 2 mentions Hövding Sverige AB as a limited liability company located in Malmö, and its past stock listing."
      ],
      contradicting_evidence: [
        "Result 1 explicitly states that Hövding Sverige AB is bankrupt and its estate was acquired by iSi Group. Result 4 confirms that Hövding Sverige AB was acquired by Pochtler Industrieholding GmbH, not remaining under its own ownership.",
        "Result 5 indicates that Hövding Sverige AB was a subsidiary of Fosielund Holding Ab but this does not clarify post-bankruptcy ownership."
      ],
      neutral_evidence: [],
      missing_evidence: [
        "Current official registration documents showing Hövding Sverige AB as the owner of the Hövding brand and product.",
        "A definitive statement from a reliable source confirming current ownership after the bankruptcy."
      ],
      summary: "Verification failed because multiple sources contradict the idea that Hövding Sverige AB is currently an independent, operating limited liability company."
    }
  },

  // ⚖️ MIXED EVIDENCE - Example with conflicting sources
  mixed_evidence: {
    verification_status: "mixed_evidence",
    verification_confidence_change: "unchanged",
    verification_evidence: {
      supporting_evidence: [
        "Company website lists current ownership structure",
        "Recent press release confirms acquisition"
      ],
      contradicting_evidence: [
        "Some financial filings show different ownership dates",
        "Industry reports suggest pending changes"
      ],
      neutral_evidence: [
        "General company information and history"
      ],
      missing_evidence: [
        "Latest quarterly reports",
        "Official regulatory filings"
      ],
      summary: "Mixed evidence found - some sources support the claim while others contradict it."
    }
  },

  // ❓ INSUFFICIENT EVIDENCE - Unknown brand example
  insufficient_evidence: {
    verification_status: "insufficient_evidence",
    verification_confidence_change: "unchanged",
    verification_evidence: {
      supporting_evidence: [],
      contradicting_evidence: [],
      neutral_evidence: [
        "Limited general information available"
      ],
      missing_evidence: [
        "Official company registration documents",
        "Corporate ownership filings",
        "Financial reports or investor relations",
        "Recent news articles about ownership"
      ],
      summary: "Insufficient evidence available to verify or contradict the ownership claim."
    }
  }
};

/**
 * Get test data for a specific status
 */
export function getVerificationTestData(status: keyof typeof verificationTestData) {
  return verificationTestData[status];
}

/**
 * Get all test data for demonstration
 */
export function getAllVerificationTestData() {
  return verificationTestData;
}
