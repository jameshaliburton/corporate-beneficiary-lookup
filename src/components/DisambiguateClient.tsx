"use client";

import { useEffect, useState } from "react";
import { DisambiguationScreen } from "./phase5-ui/DisambiguationCarousel";

type Option = {
  id: string;
  name: string;
  country?: string;
  confidence?: number;
  source?: "registry" | "web" | "ai";
  normalizedName?: string;
  countryFlag?: string;
  website?: string | null;
  // Enhanced fields for better disambiguation
  description?: string;
  financial_beneficiary?: string;
  product_name?: string;
  ownership_flow?: any[];
  // DisambiguationScreen fields
  type?: string;
  suggested?: boolean;
  logo?: string;
  confidence_score?: number;
  tagline?: string;
};

export default function DisambiguateClient({ trace, query }: { trace: string; query: string }) {
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`disambig:${trace}`);
      console.log("[DisambiguateClient] Loading trace:", trace);
      console.log("[DisambiguateClient] Raw sessionStorage data:", raw);
      if (raw) {
        const obj = JSON.parse(raw);
        console.log("[DisambiguateClient] Parsed options:", obj?.options);
        if (obj?.options && Array.isArray(obj.options)) {
          setOptions(obj.options);
        } else {
          setError("No options found in session storage");
        }
      } else {
        setError("No disambiguation data found");
      }
    } catch (err) {
      setError("Failed to load disambiguation options");
      console.error("Error loading disambiguation options:", err);
    } finally {
      setLoading(false);
    }
  }, [trace]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <h1 className="text-xl font-semibold mb-4">Pick which "{query}" you meant</h1>
        <p className="text-muted-foreground mb-4">Loading disambiguation options...</p>
        <a href="/" className="text-sm text-primary hover:underline">← Go back</a>
      </div>
    );
  }

  if (error || !options.length) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <h1 className="text-xl font-semibold mb-4">Pick which "{query}" you meant</h1>
        <p className="text-muted-foreground mb-4">{error || "No options available for this search."}</p>
        <a href="/" className="inline-block mt-4 px-4 py-2 rounded bg-primary text-primary-foreground">Go back</a>
      </div>
    );
  }

  console.log("[DisambiguateClient] Rendering DisambiguationScreen with:", { brand: query, options });
  
  // Transform options to match DisambiguationScreen interface
  const entities = options.map(option => ({
    id: option.id,
    name: option.name,
    type: option.type || option.source || 'company',
    country: option.country || 'Unknown',
    countryFlag: option.countryFlag || '🏳️',
    description: option.description || option.product_name || option.financial_beneficiary || 'No description available',
    suggested: option.suggested || false,
    logo: option.logo,
    confidence_score: option.confidence_score || option.confidence || 0,
    tagline: option.tagline
  }));

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);

  const handleChoose = (entity: any) => {
    const selectedOption = options.find(opt => opt.id === entity.id);
    if (selectedOption) {
      // Immediately disable all cards and show interstitial
      setIsTransitioning(true);
      setSelectedEntity(entity);
      
      // Re-run lookup with the selected option
      const form = new FormData();
      form.set("brand", selectedOption.normalizedName || selectedOption.name);
      
      fetch("/api/lookup", {
        method: "POST",
        body: form
      })
      .then(res => res.json())
      .then(data => {
        if (data?.success) {
          const safeBrand = data.brand || "unknown";
          window.location.href = `/result/${encodeURIComponent(safeBrand)}?success=true`;
        } else if (data?.action === "disambiguate") {
          // Still ambiguous - refresh with new options
          const newTrace = data.trace_id || `trace_${Date.now()}`;
          sessionStorage.setItem(`disambig:${newTrace}`, JSON.stringify({
            options: data.options || [],
            brand_query: data.brand_query || "",
            ts: Date.now()
          }));
          window.location.href = `/disambiguate?trace=${encodeURIComponent(newTrace)}&q=${encodeURIComponent(data.brand_query || "")}`;
        } else {
          const err = data?.error || "lookup_failed";
          window.location.href = `/result/unknown?success=false&error=${encodeURIComponent(err)}`;
        }
      })
      .catch(() => {
        window.location.href = `/result/unknown?success=false&error=network_error`;
      });
    }
  };

  const handleNotSure = () => {
    window.location.href = `/?q=${encodeURIComponent(query || "")}&wider=1`;
  };

  // Full-screen interstitial for transition
  if (isTransitioning) {
    return (
      <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-center p-8 max-w-md mx-auto">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Locking your choice…</h2>
          <p className="text-muted-foreground">We're fetching ownership details.</p>
          {selectedEntity && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">{selectedEntity.name}</p>
              <p className="text-xs text-muted-foreground">{selectedEntity.type}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <DisambiguationScreen 
      entities={entities}
      searchTerm={query}
      onChoose={handleChoose}
      onNotSure={handleNotSure}
    />
  );
}
