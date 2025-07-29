export const mockSuccessResult = {
  success: true,
  product_name: 'Pork Rinds',
  brand: 'OK Snacks A/S',
  barcode: '1234567890123',
  ownership_chain: [
    {
      name: 'OK Snacks A/S',
      role: 'Brand',
      country: 'Denmark',
      confidence: 0.92,
      sources: ['https://www.ok-snacks.com/uk/about-ok-snacks.aspx']
    },
    {
      name: 'Kims A/S',
      role: 'Parent',
      country: 'Denmark',
      confidence: 0.9,
      sources: ['https://www.kims.com/about-us']
    },
    {
      name: 'Orkla ASA',
      role: 'Ultimate Owner',
      country: 'Norway',
      confidence: 0.88,
      sources: ['https://www.orkla.com/our-business']
    }
  ],
  alternatives: [],
  confidence_score: 0.92,
  verification_status: 'verified',
  sources: [
    'https://www.ok-snacks.com/uk/about-ok-snacks.aspx',
    'https://www.kims.com/about-us',
    'https://www.orkla.com/our-business'
  ],
  trace: [
    { step: 'Initial web search', status: 'completed', details: 'Found OK Snacks A/S official website' },
    { step: 'Corporate registry search', status: 'completed', details: 'Confirmed parent company Kims A/S' },
    { step: 'Ultimate owner identification', status: 'completed', details: 'Orkla ASA identified as ultimate owner' }
  ]
};

export const mockAmbiguousResult = {
  success: true,
  product_name: 'Pork Rinds',
  brand: 'OK Snacks A/S',
  barcode: '1234567890123',
  ownership_flow: [
    {
      name: 'OK Snacks A/S',
      type: 'Brand',
      country: 'Denmark',
      flag: '🇩🇰',
      ultimate: false
    }
  ],
  alternatives: [
    {
      name: 'OK Benzin A/S',
      type: 'Brand',
      country: 'Denmark',
      confidence: 60,
      reason: 'Same country, different industry (fuel)',
      sources: ['https://www.ok-benzin.dk']
    },
    {
      name: 'OK Foods',
      type: 'Brand',
      country: 'United States',
      confidence: 40,
      reason: 'Different country and industry (poultry)',
      sources: ['https://www.okfoods.com']
    }
  ],
  confidence_score: 92,
  verification_status: 'needs_verification',
  sources: [
    'https://www.ok-snacks.com/uk/about-ok-snacks.aspx'
  ],
  trace: [
    { step: 'Initial search', status: 'completed', details: 'Found multiple OK companies' },
    { step: 'Disambiguation analysis', status: 'completed', details: 'Identified correct company based on industry context' }
  ]
};

export const mockBadJSONResult = {
  success: false,
  ownership_chain: [],
  alternatives: [],
  confidence_score: 0,
  verification_status: 'uncertain',
  trace: [
    { step: 'Web search', status: 'completed', details: 'Search completed but response malformed' },
    { step: 'JSON repair attempt', status: 'failed', details: 'Repair unsuccessful, falling back to error state' }
  ],
  error: 'Malformed JSON response'
};

export const mockTimeoutResult = {
  success: false,
  ownership_chain: [],
  alternatives: [],
  confidence_score: 0,
  verification_status: 'uncertain',
  trace: [
    { step: 'Initial search attempt', status: 'timeout', details: 'Request timed out' },
    { step: 'Retry attempt 1', status: 'timeout', details: 'Request timed out' },
    { step: 'Retry attempt 2', status: 'timeout', details: 'Request timed out' }
  ],
  error: 'Request timed out after multiple retry attempts.'
};

export const mockUnknownResult = {
  success: false,
  product_name: 'Unknown Product',
  brand: 'Unknown Brand',
  barcode: 'Unknown Barcode',
  ownership_flow: [],
  alternatives: [],
  confidence_score: 0,
  verification_status: 'uncertain',
  sources: [],
  trace: [
    { step: 'Web search', status: 'completed', details: 'No relevant sources found' },
    { step: 'Corporate registry search', status: 'completed', details: 'No matching companies found' },
    { step: 'News and media search', status: 'completed', details: 'No recent ownership information found' }
  ]
};

export const mockFollowUpContextResult = {
  success: true,
  ownership_chain: [
    {
      name: 'OK Snacks A/S',
      role: 'Brand',
      country: 'Denmark',
      confidence: 0.95,
      sources: ['https://www.ok-snacks.com/uk/about-ok-snacks.aspx', 'https://virk.dk/company/ok-snacks']
    },
    {
      name: 'Kims A/S',
      role: 'Parent',
      country: 'Denmark',
      confidence: 0.93,
      sources: ['https://www.kims.com/about-us', 'https://virk.dk/company/kims']
    }
  ],
  alternatives: [],
  confidence_score: 0.95,
  verification_status: 'verified',
  trace: [
    { step: 'Context-enhanced search', status: 'completed', details: 'Used Danish context to target corporate registry' },
    { step: 'Registry verification', status: 'completed', details: 'Confirmed ownership through official Danish registry' }
  ],
  context_used: 'pork rinds from Denmark'
}; 