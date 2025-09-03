/**
 * Helper function to promote narrative fields from generated_copy to top-level
 * This ensures backward compatibility when the UI expects fields at the top level
 * but they're stored in the generated_copy object
 */
export function unwrapGeneratedCopy(result: any) {
  if (!result) return result;
  
  const generated = result.generated_copy ?? {};
  
  return {
    ...result,
    // Promote narrative fields from generated_copy to top level if not already present
    headline: result.headline ?? generated.headline,
    story: result.story ?? generated.story,
    tagline: result.tagline ?? generated.tagline,
    ownership_notes: result.ownership_notes ?? generated.ownership_notes ?? [],
    behind_the_scenes: result.behind_the_scenes ?? generated.behind_the_scenes ?? [],
    template_used: result.template_used ?? generated.template_used,
    narrative_template_used: result.narrative_template_used ?? generated.template_used,
    // Ensure hasGeneratedCopy is properly set
    hasGeneratedCopy: result.hasGeneratedCopy ?? !!(generated.headline || generated.story)
  };
}
