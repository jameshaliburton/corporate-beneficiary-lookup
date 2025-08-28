export interface LanguageDetection {
  languages: Array<{
    lang: string;
    conf: number;
  }>;
  dominant: string;
  cluster: string;
  strength: 'strong' | 'mixed' | 'weak';
}

export interface LanguageCluster {
  [key: string]: string;
}

// Language cluster mapping for regional grouping
export const languageClusterMap: LanguageCluster = {
  'sv': 'SE',      // Swedish
  'fi': 'FI',      // Finnish  
  'da': 'Nordics', // Danish
  'no': 'Nordics', // Norwegian
  'de': 'DE',      // German
  'fr': 'FR',      // French
  'en': 'EN',      // English
  'es': 'ES',      // Spanish
  'it': 'IT',      // Italian
  'ja': 'JP',      // Japanese
  'ko': 'KR',      // Korean
  'zh': 'CN',      // Chinese
};

/**
 * Detect packaging languages from OCR text
 * Uses script detection patterns to identify language families
 */
export function detectPackagingLanguages(text: string): LanguageDetection {
  if (!text || text.trim().length === 0) {
    return {
      languages: [],
      dominant: 'en',
      cluster: 'EN',
      strength: 'weak'
    };
  }

  const normalizedText = text.toLowerCase();
  const languages: Array<{lang: string, conf: number}> = [];
  
  // Script-based language detection patterns
  const patterns = {
    // Nordic languages
    'sv': /[åäö]/g,  // Swedish specific characters
    'fi': /[äö]/g,   // Finnish specific characters  
    'da': /[æøå]/g,  // Danish specific characters
    'no': /[æøå]/g,  // Norwegian specific characters
    
    // German
    'de': /[äöüß]/g, // German umlauts
    
    // French
    'fr': /[àâäéèêëïîôöùûüÿç]/g, // French accents
    
    // Spanish
    'es': /[áéíóúñü]/g, // Spanish accents
    
    // Italian
    'it': /[àèéìíîòóù]/g, // Italian accents
    
    // Japanese (hiragana/katakana)
    'ja': /[\u3040-\u309F\u30A0-\u30FF]/g,
    
    // Korean (hangul)
    'ko': /[\uAC00-\uD7AF]/g,
    
    // Chinese (simplified/traditional)
    'zh': /[\u4E00-\u9FFF]/g,
  };

  // Calculate confidence scores for each language
  for (const [lang, pattern] of Object.entries(patterns)) {
    const matches = normalizedText.match(pattern);
    if (matches) {
      const confidence = Math.min(0.9, matches.length / Math.max(1, normalizedText.length * 0.1));
      languages.push({ lang, conf: confidence });
    }
  }

  // Check for English (default case)
  const englishWords = ['the', 'and', 'of', 'to', 'in', 'for', 'with', 'on', 'at', 'by'];
  const englishCount = englishWords.filter(word => normalizedText.includes(word)).length;
  if (englishCount > 0) {
    const englishConf = Math.min(0.8, englishCount / 5);
    languages.push({ lang: 'en', conf: englishConf });
  }

  // Sort by confidence
  languages.sort((a, b) => b.conf - a.conf);

  // Determine dominant language and cluster
  let dominant = 'unknown';
  let cluster = 'unknown';
  let strength: 'strong' | 'mixed' | 'weak' = 'weak';

  if (languages.length > 0) {
    const topLang = languages[0];
    dominant = topLang.lang;
    cluster = languageClusterMap[topLang.lang] || 'unknown';
    
    // Determine strength
    if (topLang.conf > 0.7 && languages.length === 1) {
      strength = 'strong';
    } else if (topLang.conf > 0.5 || languages.length > 1) {
      strength = 'mixed';
    } else {
      strength = 'weak';
    }
  }

  const result = {
    languages,
    dominant,
    cluster,
    strength
  };

  // Log language detection for telemetry
  if (result.strength !== 'weak') {
    console.info(`[lang-signal] dominant=${result.dominant} cluster=${result.cluster} strength=${result.strength}`);
  }

  return result;
}

/**
 * Check if language signals contradict each other
 */
export function hasLanguageContradiction(
  detectedLanguages: LanguageDetection,
  candidateCountry: string
): boolean {
  if (detectedLanguages.strength === 'weak') {
    return false;
  }

  const countryToCluster: { [key: string]: string } = {
    'Sweden': 'SE',
    'Finland': 'FI', 
    'Denmark': 'Nordics',
    'Norway': 'Nordics',
    'Germany': 'DE',
    'France': 'FR',
    'United States': 'EN',
    'United Kingdom': 'EN',
    'Spain': 'ES',
    'Italy': 'IT',
    'Japan': 'JP',
    'South Korea': 'KR',
    'China': 'CN',
  };

  const candidateCluster = countryToCluster[candidateCountry];
  if (!candidateCluster || !detectedLanguages.cluster) {
    return false;
  }

  return detectedLanguages.cluster !== candidateCluster;
}

/**
 * Get language modifier for scoring
 */
export function getLanguageModifier(
  detectedLanguages: LanguageDetection,
  candidateCountry: string,
  logoConfidence: number,
  ocrConfidence: number
): { modifier: number; rationale: string } {
  const hasContradiction = hasLanguageContradiction(detectedLanguages, candidateCountry);
  const isWeakSignal = logoConfidence < 0.6 || ocrConfidence < 0.6;
  
  if (hasContradiction && isWeakSignal && detectedLanguages.strength === 'strong') {
    return {
      modifier: 0.5,
      rationale: 'strong_contradiction'
    };
  } else if (hasContradiction && detectedLanguages.strength === 'mixed') {
    return {
      modifier: 0.7,
      rationale: 'mixed_contradiction'
    };
  } else if (!hasContradiction && detectedLanguages.strength === 'strong') {
    return {
      modifier: 1.05,
      rationale: 'supportive_match'
    };
  }
  
  const result = {
    modifier: 1.0,
    rationale: 'no_effect'
  };

  // Log language modifier application for telemetry
  if (result.modifier !== 1.0) {
    console.info(`[lang-signal] dominant=${detectedLanguages.dominant} cluster=${detectedLanguages.cluster} modifier=${result.modifier} reason="${result.rationale}"`);
  }

  return result;
}
