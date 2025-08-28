import { countryFlags } from "./countryFlags";

export function generateOwnershipRevealCopy(data: any) {
  const brand = data.brand || "This brand";
  const owner = data.financial_beneficiary || data.ultimate_owner || "its parent company";
  const country = data.beneficiary_country || "another country";
  const origin = data.origin_country || data.beneficiary_country || country;

  const flag = countryFlags[country] || "🌍";
  const originFlag = countryFlags[origin] || flag;

  const brandLower = brand.toLowerCase();
  const ownerLower = owner.toLowerCase();
  const isSameEntity = ownerLower.includes(brandLower) || brandLower.includes(ownerLower);
  const isDifferentCountry = origin.toLowerCase() !== country.toLowerCase();

  let headline;
  let tagline;

  if (isSameEntity) {
    headline = `${brand}: Fully ${country} owned ${flag}`;
    tagline = `${brand} is a ${country}-based brand, owned and controlled by ${owner}.`;
  } else if (isDifferentCountry) {
    headline = `${brand} started in ${origin}… now owned in ${country}! ${flag}`;
    tagline = `${brand} began in ${origin} ${originFlag}, but today it's ultimately owned by ${owner} in ${country} ${flag}.`;
  } else {
    headline = `${brand} isn't as local as you think… ${flag}`;
    tagline = `${brand} is ultimately owned by ${owner} in ${country}.`;
  }

  return { headline, tagline };
} 