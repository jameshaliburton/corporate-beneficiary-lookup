export const shouldWriteCache = (status: 'ok' | 'degraded' | 'failed') => status === 'ok';

export const negativeCacheTtlMs = (code?: number) => (code === 529 ? 10_000 : 0);
