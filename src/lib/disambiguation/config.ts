export const DisambigConfig = {
  thresholds: {
    strong: Number(process.env.DISAMBIG_STRONG_CONF ?? 0.80),
    weak:   Number(process.env.DISAMBIG_WEAK_CONF   ?? 0.60),
    minGap: Number(process.env.DISAMBIG_MIN_GAP     ?? 0.12)
  },
  langModifiers: { // informational; actual math still in language.ts
    none: 1.05, mild: 0.70, strong: 0.50
  },
  // version stamp for telemetry
  version: "v1-lang-signal"
} as const;
