function normalizeCountry(str?: string) {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z]/g, '');
}

function isSameEntity(a: string, b: string): boolean {
  if (!a || !b) return false;
  const normalize = (str: string) =>
    str.toLowerCase().trim().replace(/[^a-z0-9]/g, '').replace(/(inc|ab|ltd|llc|corp|company)$/i, '');
  return normalize(a).includes(normalize(b)) || normalize(b).includes(normalize(a));
}

export function generateCardTagline(result: any): { headline: string; tagline: string } {
  const brand = result.brand || "";
  const ultimateOwner = result.financial_beneficiary || result.ultimate_owner || "";
  const country = result.beneficiary_country || "";
  const brandCountry = result.ownership_flow?.[0]?.country || "";

  // Debug logs for country inputs
  console.log("[generateCardTagline] Inputs:", {
    brand,
    brandCountry,
    ultimateOwner,
    country
  });

  // Determine if same country using normalized comparison
  const sameCountry = normalizeCountry(brandCountry) === normalizeCountry(country);
  
  // Determine if same entity using robust comparison
  const sameEntity = isSameEntity(brand, ultimateOwner);

  let headline = `👀 ${brand} isn't as local as you think…`;
  
  if (sameEntity) {
    headline = `💡 ${brand} is proudly ${country}-owned ${result.beneficiary_flag || ""}`;
  } else if (sameCountry) {
    headline = `💡 ${brand} is owned in ${country} ${result.beneficiary_flag || ""}`;
  }

  // Always generate a tagline
  const tagline = ultimateOwner && country
    ? `Your purchases ultimately support ${ultimateOwner} in ${country}.`
    : `Your purchases ultimately support ${ultimateOwner || "its parent company"} in ${country || "another country"}.`;

  return { headline, tagline };
} 