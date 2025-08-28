// SessionStorage utilities for consistent pipeline result handling

export const setPipelineResult = (brand: string, data: any) => {
  try {
    const storageKey = `pipelineResult_${brand || 'unknown'}`;
    const sessionData = JSON.stringify(data);
    sessionStorage.setItem(storageKey, sessionData);
    console.log(`✅ Stored pipelineResult for ${brand}`, data);
    return true;
  } catch (err) {
    console.error(`❌ Failed to store pipelineResult for ${brand}`, err);
    return false;
  }
};

export const getPipelineResult = (brand: string) => {
  try {
    const storageKey = `pipelineResult_${brand || 'unknown'}`;
    const cached = sessionStorage.getItem(storageKey);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  } catch (err) {
    console.error(`❌ Failed to get pipelineResult for ${brand}`, err);
    return null;
  }
};

export const removePipelineResult = (brand: string) => {
  try {
    const storageKey = `pipelineResult_${brand || 'unknown'}`;
    sessionStorage.removeItem(storageKey);
    console.log(`🗑️ Removed pipelineResult for ${brand}`);
    return true;
  } catch (err) {
    console.error(`❌ Failed to remove pipelineResult for ${brand}`, err);
    return false;
  }
};

export const clearAllPipelineResults = () => {
  try {
    const keys = Object.keys(sessionStorage);
    const pipelineKeys = keys.filter(key => key.startsWith('pipelineResult_'));
    pipelineKeys.forEach(key => sessionStorage.removeItem(key));
    console.log(`🗑️ Cleared ${pipelineKeys.length} pipeline results`);
    return true;
  } catch (err) {
    console.error('❌ Failed to clear pipeline results', err);
    return false;
  }
};

// Helper to check if sessionStorage is available (SSR-safe)
export const isSessionStorageAvailable = () => {
  return typeof window !== 'undefined' && window.sessionStorage;
};

// Helper to get all pipeline result keys
export const getAllPipelineResultKeys = () => {
  try {
    const keys = Object.keys(sessionStorage);
    return keys.filter(key => key.startsWith('pipelineResult_'));
  } catch (err) {
    console.error('❌ Failed to get pipeline result keys', err);
    return [];
  }
}; 