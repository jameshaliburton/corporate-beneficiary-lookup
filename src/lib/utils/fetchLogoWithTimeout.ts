export async function fetchLogoWithTimeout(entityName: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1000);

  try {
    console.log("📩 [fetchLogoWithTimeout] Request for entity:", entityName);
    
    const res = await fetch(`/api/logo-search?query=${encodeURIComponent(entityName)}`, {
      signal: controller.signal,
    });
    
    if (!res.ok) {
      console.error("❌ [fetchLogoWithTimeout] HTTP error:", res.status, res.statusText);
      return null;
    }
    
    const data = await res.json();
    console.log("✅ [fetchLogoWithTimeout] Response:", data);
    
    return data.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(entityName)}&background=random`;
  } catch (e) {
    console.error("❌ [fetchLogoWithTimeout] Error:", e);
    return null;
  } finally {
    clearTimeout(timeout);
  }
} 