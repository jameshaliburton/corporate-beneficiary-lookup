export async function generateTagline(entity: any) {
  try {
    console.log("📩 [generateTagline] Request for entity:", entity);
    
    const requestBody = {
      brand: entity.name || entity.brand,
      ultimateOwner: entity.financial_beneficiary,
      country: entity.country || entity.beneficiary_country
    };
    
    console.log("📩 [generateTagline] Request body:", requestBody);
    
    const res = await fetch("/api/generateTagline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
    
    if (!res.ok) {
      console.error("❌ [generateTagline] HTTP error:", res.status, res.statusText);
      return `${entity.name || entity.brand} is owned by ${entity.financial_beneficiary || "its parent company"}.`;
    }
    
    const data = await res.json();
    console.log("✅ [generateTagline] Response:", data);
    
    return data.tagline || `${entity.name || entity.brand} is owned by ${entity.financial_beneficiary || "its parent company"}.`;
  } catch (e) {
    console.error("❌ [generateTagline] Error:", e);
    return `${entity.name || entity.brand} is owned by ${entity.financial_beneficiary || "its parent company"}.`;
  }
} 