export async function generateOwnershipCopy(ownershipFlow: any[], notes?: string[]) {
  const prompt = `
You are generating consumer-facing copy about brand ownership.

Input:
- A structured ownership chain (brand → parent(s) → ultimate owner(s))
- Optional notes about minority stakes, JVs, or special cases.

Task:
1. Generate a short, punchy headline with 1 emoji that "exposes" the ultimate owner.  
   Example: "😮 Did you know Kit Kat is part of Nestlé?"  
2. Write a 1-sentence subheadline explaining the relationship.  
3. If notes exist, write 1 short factual note for each.  
4. Write a fun social share text that includes the brand name.

Output JSON:
{
  "headline": "...",
  "subheadline": "...",
  "notes": ["...", "..."],
  "shareText": "..."
}
  `;

  // For now, return mock data until we integrate with actual LLM API
  // This will be replaced with actual LLM API call
  const mockResponse = {
    headline: "😮 Did you know this brand is owned by a giant?",
    subheadline: "This popular brand is actually part of a massive multinational corporation.",
    notes: notes || [],
    shareText: "Just discovered who really owns this brand! 🤯"
  };

  return mockResponse;
} 