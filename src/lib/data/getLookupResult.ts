export async function getLookupResult(brand: string, debugDisambig?: boolean, chosenEntityId?: string) {
  try {
    // For server components, we need an absolute URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (debugDisambig && process.env.NODE_ENV !== "production") {
      headers["X-Debug-Disambig"] = "1";
    }
    
    const body: any = { brand };
    if (chosenEntityId) {
      body.chosen_entity_id = chosenEntityId;
    }
    
    const res = await fetch(`${baseUrl}/api/lookup`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    });
    
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`lookup failed: ${res.status} ${res.statusText} ${text}`);
    }

    return res.json();
  } catch (error) {
    throw error;
  }
}
