type AnyObj = Record<string, any>;

function pickStory(raw: AnyObj): string {
  // New shape
  if (raw?.narrative?.story) return String(raw.narrative.story);
  // Older shape
  if (raw?.generated_copy?.description) return String(raw.generated_copy.description);
  // Very old
  if (raw?.ownership_notes) return String(raw.ownership_notes);
  return "";
}

function pickTrace(raw: AnyObj): AnyObj {
  return raw?.trace ?? raw?.agent_execution_trace ?? {};
}

function getSourceChip(trace: AnyObj, metadata: AnyObj): string {
  // Check for registry results first (most specific)
  if (trace?.registry_results?.length > 0 || 
      trace?.stages?.some((s: AnyObj) => /registry|brreg|cvr|companies/i.test(s?.name || ""))) {
    return "Registry";
  }
  
  // Check for web research flag (boolean)
  if (trace?.web_research_used === true || 
      trace?.stages?.some((s: AnyObj) => /web|research|bing|google/i.test(s?.name || ""))) {
    return "Web";
  }
  
  // Default to AI
  return "AI";
}

function buildBtsSummary(trace: AnyObj, metadata: AnyObj): string {
  const stages = Array.isArray(trace?.stages) ? trace.stages : [];
  const hasRegistry = stages.some((s: AnyObj) => /registry|brreg|cvr|companies/i.test(s?.name || ""));
  const hasWeb = stages.some((s: AnyObj) => /web|research|bing|google/i.test(s?.name || ""));
  const method = hasRegistry ? "Registry lookup + AI check"
    : hasWeb ? "AI + web research"
    : "AI analysis";
  const source =
    metadata?.source_type === "official_registry" ? "Official registry" :
    metadata?.source_type === "third_party" ? "Reliable third-party sources" :
    metadata?.source_type === "inferred" ? "AI inference" :
    (metadata?.source_type || "AI inference");
  const conf =
    metadata?.confidence_level ? String(metadata.confidence_level).replace(/^\w/, (c: string) => c.toUpperCase()) :
    metadata?.verification_status ? String(metadata.verification_status).replace(/^\w/, (c: string) => c.toUpperCase()) :
    "Unverified";
  return `${method} • Source: ${source} • ${conf}`;
}

export function normalizeLookupResult(raw: AnyObj, brandFallback: string) {
  const brand = raw?.brand ?? brandFallback ?? "";
  const trace = pickTrace(raw);
  const metadata = raw?.metadata ?? {};
  const story = pickStory(raw);

  const financial_beneficiary =
    raw?.financial_beneficiary ??
    raw?.ultimate_owner ??
    raw?.owner ??
    "";

  const confidence_score =
    raw?.confidence_score ??
    raw?.confidence ??
    null;

  // What we found: short factual line
  const whatWeFound =
    raw?.ownership_summary ||
    (financial_beneficiary
      ? `${brand} is owned by ${financial_beneficiary}.`
      : `Ownership identified for ${brand}.`);

  // One-liner BTS string (ProductResult expects a string)
  const behindTheScenes = buildBtsSummary(trace, metadata);
  const sourceChip = getSourceChip(trace, metadata);

  // Map the new API fields we validated in diagnostics
  const headline = raw?.headline || null;
  const tagline = raw?.tagline || null;
  const behind_the_scenes = raw?.behind_the_scenes || null;
  const ownership_notes = raw?.ownership_notes || null;
  
  // Ensure trace fields are properly mapped
  const orchestrator_path = trace?.orchestrator_path || null;
  const confidence = trace?.confidence || null;

  return {
    brand,
    narrative: { story },
    trace,
    metadata,
    financial_beneficiary,
    confidence_score,
    whatWeFound,
    behindTheScenes, // string
    sourceChip, // "Registry" | "Web" | "AI"
    // New API fields
    headline,
    tagline,
    behind_the_scenes,
    ownership_notes,
    orchestrator_path,
    confidence,
    _raw: raw,
  };
}
