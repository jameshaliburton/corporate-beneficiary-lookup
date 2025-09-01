export const verificationTestData = {
  confirmed: {
    verification_status: 'confirmed',
    verification_confidence_change: 'increased',
    verification_evidence: {
      supporting_evidence: [
        'Result 1 (Wikipedia) states Shell plc is a multinational oil and gas company and mentions "Shell" as part of its name.',
        'Result 2 (Shell Global history) describes the formation of Royal Dutch Shell Group, the predecessor of Shell plc, demonstrating a long-standing association with the "Shell" brand.',
        'Result 3 (Wikipedia Shell USA) explicitly states that Shell USA, Inc. is a wholly owned subsidiary of Shell plc.',
        'Result 4 (Shell Annual Report) shows that the financial statements include those of Shell plc and its subsidiaries, implicitly confirming ownership structure.'
      ],
      contradicting_evidence: [],
      neutral_evidence: [],
      missing_evidence: []
    },
    confidence_assessment: {
      original_confidence: 85,
      verified_confidence: 95,
      confidence_change: 'increased'
    }
  },
  contradicted: {
    verification_status: 'contradicted',
    verification_confidence_change: 'decreased',
    verification_evidence: {
      supporting_evidence: [],
      contradicting_evidence: [
        'Result 1 (Company Database) shows the brand is owned by Company A',
        'Result 2 (Financial Report) indicates ownership by Company B',
        'Result 3 (Press Release) contradicts previous ownership claims'
      ],
      neutral_evidence: [],
      missing_evidence: []
    },
    confidence_assessment: {
      original_confidence: 80,
      verified_confidence: 30,
      confidence_change: 'decreased'
    }
  },
  mixed_evidence: {
    verification_status: 'mixed_evidence',
    verification_confidence_change: 'unchanged',
    verification_evidence: {
      supporting_evidence: [
        'Result 1 supports the ownership claim'
      ],
      contradicting_evidence: [
        'Result 2 contradicts the ownership claim'
      ],
      neutral_evidence: [
        'Result 3 provides neutral information'
      ],
      missing_evidence: []
    },
    confidence_assessment: {
      original_confidence: 60,
      verified_confidence: 60,
      confidence_change: 'unchanged'
    }
  },
  insufficient_evidence: {
    verification_status: 'insufficient_evidence',
    verification_confidence_change: 'unchanged',
    verification_evidence: {
      supporting_evidence: [],
      contradicting_evidence: [],
      neutral_evidence: [],
      missing_evidence: [
        'No recent ownership information found',
        'Company structure unclear from available sources',
        'Limited public records available'
      ]
    },
    confidence_assessment: {
      original_confidence: 40,
      verified_confidence: 40,
      confidence_change: 'unchanged'
    }
  }
};
