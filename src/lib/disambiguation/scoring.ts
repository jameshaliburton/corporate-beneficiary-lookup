import { LanguageDetection, getLanguageModifier } from '../signals/language';
import { DisambigConfig } from './config';

export interface DisambiguationCandidate {
  id: string;
  name: string;
  country: string;
  confidence: number;
  source: 'registry' | 'web' | 'ai';
  logoConfidence?: number;
  ocrConfidence?: number;
}

export interface ScoringResult {
  candidates: DisambiguationCandidate[];
  topScore: number;
  secondScore: number;
  scoreGap: number;
  decisionRules: string[];
  shouldDisambiguate: boolean;
}

/**
 * Apply language modifier to candidate scores
 */
export function applyLanguageModifier(
  score: number,
  candidate: DisambiguationCandidate,
  langSignal: LanguageDetection
): { modifiedScore: number; modifier: number; rationale: string } {
  const { modifier, rationale } = getLanguageModifier(
    langSignal,
    candidate.country,
    candidate.logoConfidence || 0,
    candidate.ocrConfidence || 0
  );

  const modifiedScore = score * modifier;

  return {
    modifiedScore,
    modifier,
    rationale
  };
}

/**
 * Score disambiguation candidates with language signals
 */
export function scoreDisambiguationCandidates(
  candidates: DisambiguationCandidate[],
  langSignal?: LanguageDetection
): ScoringResult {
  if (candidates.length === 0) {
    return {
      candidates: [],
      topScore: 0,
      secondScore: 0,
      scoreGap: 0,
      decisionRules: [],
      shouldDisambiguate: false
    };
  }

  // Apply language modifiers if available
  const scoredCandidates = candidates.map(candidate => {
    let finalScore = candidate.confidence;
    let languageModifier = 1.0;
    let languageRationale = 'no_effect';

    if (langSignal) {
      const { modifiedScore, modifier, rationale } = applyLanguageModifier(
        candidate.confidence,
        candidate,
        langSignal
      );
      finalScore = modifiedScore;
      languageModifier = modifier;
      languageRationale = rationale;
    }

    return {
      ...candidate,
      finalScore,
      languageModifier,
      languageRationale
    };
  });

  // Sort by final score
  scoredCandidates.sort((a, b) => b.finalScore - a.finalScore);

  const topScore = scoredCandidates[0]?.finalScore || 0;
  const secondScore = scoredCandidates[1]?.finalScore || 0;
  const scoreGap = topScore - secondScore;

  // Decision rules for disambiguation
  const decisionRules: string[] = [];
  let shouldDisambiguate = false;

  // Rule 1: Close scores
  if (scoreGap < DisambigConfig.thresholds.minGap) {
    decisionRules.push('close_scores');
    shouldDisambiguate = true;
  }

  // Rule 2: Language contradiction
  if (langSignal && langSignal.strength === 'strong') {
    const topCandidate = scoredCandidates[0];
    if (topCandidate && topCandidate.languageRationale.includes('contradiction')) {
      decisionRules.push('language_contradiction');
      shouldDisambiguate = true;
      console.info(`[disambig] reason="language_contradiction"`);
    }
  }

  // Rule 3: Weak signals with language contradiction
  if (langSignal && langSignal.strength === 'strong') {
    const topCandidate = scoredCandidates[0];
    const isWeakSignal = (topCandidate?.logoConfidence || 0) < DisambigConfig.thresholds.weak || (topCandidate?.ocrConfidence || 0) < DisambigConfig.thresholds.weak;
    if (isWeakSignal && topCandidate?.languageRationale.includes('contradiction')) {
      decisionRules.push('weak_signals_with_language_contradiction');
      shouldDisambiguate = true;
    }
  }

  // Rule 4: Category conflicts (placeholder for future implementation)
  // This would check if the candidate's domain conflicts with the detected category

  return {
    candidates: scoredCandidates,
    topScore,
    secondScore,
    scoreGap,
    decisionRules,
    shouldDisambiguate
  };
}

/**
 * Check if we should accept without disambiguation
 */
export function shouldAcceptWithoutDisambiguation(
  candidates: DisambiguationCandidate[],
  langSignal?: LanguageDetection,
  brandAmbiguous?: boolean
): boolean {
  if (candidates.length === 0) {
    return true;
  }

  const topCandidate = candidates[0];
  const logoStrong = (topCandidate.logoConfidence || 0) > DisambigConfig.thresholds.strong;
  const ocrStrong = (topCandidate.ocrConfidence || 0) > DisambigConfig.thresholds.strong;

  // Accept if brand is not ambiguous and we have strong signals
  if (brandAmbiguous === false && (logoStrong || ocrStrong)) {
    return true;
  }

  // Accept if we have strong signals and no language contradiction
  if (logoStrong || ocrStrong) {
    if (!langSignal || langSignal.strength === 'weak') {
      return true;
    }
    
    // Check for language support
    const { modifier } = getLanguageModifier(
      langSignal,
      topCandidate.country,
      topCandidate.logoConfidence || 0,
      topCandidate.ocrConfidence || 0
    );
    
    if (modifier >= 1.0) {
      return true;
    }
  }

  return false;
}
