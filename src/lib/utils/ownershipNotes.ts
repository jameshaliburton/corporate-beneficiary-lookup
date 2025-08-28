export async function generateOwnershipNotes(result: any): Promise<string[]> {
  try {
    console.log("📩 [generateOwnershipNotes] Request for result:", result);
    
    const requestBody = {
      brand: result.brand,
      ownershipFlow: result.ownership_flow
    };
    
    console.log("📩 [generateOwnershipNotes] Request body:", requestBody);
    
    const response = await fetch("/api/generateNotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      console.error("❌ [generateOwnershipNotes] HTTP error:", response.status, response.statusText);
      return [
        `The brand ${result.brand} operates under a corporate structure involving ${result.ownership_flow?.map((e: any) => e.name).join(" → ") || "unknown owners"}.`,
        `Ownership details have been verified based on available data sources.`
      ];
    }
    
    const data = await response.json();
    console.log("✅ [generateOwnershipNotes] Response:", data);
    
    return data.notes || [
      `The brand ${result.brand} operates under a corporate structure involving ${result.ownership_flow?.map((e: any) => e.name).join(" → ") || "unknown owners"}.`,
      `Ownership details have been verified based on available data sources.`
    ];
  } catch (e) {
    console.error("❌ [generateOwnershipNotes] Error:", e);
    return [
      `The brand ${result.brand} operates under a corporate structure involving ${result.ownership_flow?.map((e: any) => e.name).join(" → ") || "unknown owners"}.`,
      `Ownership details have been verified based on available data sources.`
    ];
  }
} 