type TraceData = any;

export interface BreadcrumbChip {
  label: string;
  emoji: string;
}

export function buildBreadcrumbs(trace: TraceData): BreadcrumbChip[] {
  const chips: BreadcrumbChip[] = [];
  
  if (!trace) return chips;

  // 👁️ Visual Parse — if trace.input_mode === "image" OR OCR/vision hints exist
  if (trace.input_mode === "image" || 
      trace.stages?.some((s: any) => /ocr|vision|image|visual/i.test(s?.name || ""))) {
    chips.push({ label: "Visual Parse", emoji: "👁️" });
  }

  // 🔤 Brand Clean-up — if the brand was normalized
  if (trace.normalized_brand && trace.normalized_brand !== trace.brand) {
    chips.push({ label: "Brand Clean-up", emoji: "🔤" });
  }

  // 🧠 Ownership Reasoning — if an LLM/analysis stage exists
  if (trace.stages?.some((s: any) => /ownership|llm|analysis|reasoning/i.test(s?.name || ""))) {
    chips.push({ label: "Ownership Reasoning", emoji: "🧠" });
  }

  // 🧾 Registry Check — if any registry hits exist
  if (trace.registry_results?.length > 0 || 
      trace.stages?.some((s: any) => /registry|brreg|cvr|companies/i.test(s?.name || ""))) {
    chips.push({ label: "Registry Check", emoji: "🧾" });
  }

  // 🔎 Web Corroboration — if web research was used
  if (trace.web_research_used === true || 
      trace.stages?.some((s: any) => /web|research|bing|google/i.test(s?.name || ""))) {
    chips.push({ label: "Web Corroboration", emoji: "🔎" });
  }

  return chips.slice(0, 5); // Max 5 chips
}
