# Evaluation Dashboard V4 - Refactoring Recommendations

## 📊 **EXECUTIVE SUMMARY**

Based on comprehensive analysis of the Evaluation Dashboard V4 implementation, here are the **refactoring recommendations** to improve code quality, performance, and maintainability.

**Overall Assessment**: The codebase is **well-structured** but has several areas that need cleanup and optimization.

---

## 🗑️ **CODE TO REMOVE**

### **1. Hardcoded Test Data in EvalV4Dashboard.tsx**
**Location**: `src/components/eval-v4/EvalV4Dashboard.tsx` (lines 130-220)
**Issue**: Large block of hardcoded test data that should be replaced with real API calls

```typescript
// REMOVE THIS BLOCK
const testData = [
  {
    id: "test_001",
    brand: "Coca-Cola",
    product: "Coca-Cola 2L",
    owner: "The Coca-Cola Company",
    // ... 90+ lines of hardcoded data
  }
]
```

**Action**: Replace with real API call to `/api/evaluation/v3/results`

### **2. Unused Mock Data Files**
**Location**: `src/lib/eval-v4/mockData.ts`
**Issue**: Mock data is no longer needed since real data is available

```typescript
// REMOVE ENTIRE FILE
export const mockScanResults: ScanResult[] = [
  // ... 300+ lines of mock data
]
```

**Action**: Delete file and remove all imports

### **3. TODO Comments Without Implementation**
**Location**: Multiple files
**Issue**: Placeholder comments that should be implemented or removed

```typescript
// REMOVE OR IMPLEMENT
// TODO: Implement actual rerun logic
// TODO: Implement actual flag logic
// TODO: Add advanced filtering
```

**Action**: Either implement the functionality or remove the comments

### **4. Unused Environment Variables**
**Location**: `.env.local`
**Issue**: Environment variables that are not being used

```bash
# REMOVE IF NOT USED
GOOGLE_SHEET_EVALUATION_CASES=...
GOOGLE_SHEET_EVALUATION_RESULTS=...
GOOGLE_SHEET_EVALUATION_STEPS=...
GOOGLE_SHEET_OWNERSHIP_MAPPINGS=...
```

**Action**: Remove unused variables and keep only the ones actually used

---

## 🔄 **CODE TO REFACTOR**

### **1. EvalV4Dashboard.tsx - Data Fetching Logic**

**Current Issue**: Mixed responsibilities, hardcoded data, poor error handling

```typescript
// CURRENT - PROBLEMATIC
const fetchData = async () => {
  try {
    const response = await fetch('/api/evaluation/v3/results?dataSource=live')
    // ... hardcoded test data fallback
    setResults(testData) // This should be real data
  } catch (error) {
    setError(error.message)
  }
}
```

**Refactored Solution**:
```typescript
// REFACTORED - CLEAN SEPARATION
const useEvaluationData = () => {
  const [data, setData] = useState<ScanResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (filters?: EvaluationFilters) => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams()
      if (filters?.searchTerm) params.append('search', filters.searchTerm)
      if (filters?.confidenceMin) params.append('confidenceMin', filters.confidenceMin.toString())
      if (filters?.source) params.append('dataSource', filters.source)
      
      const response = await fetch(`/api/evaluation/v3/results?${params}`)
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }
      
      const result = await response.json()
      setData(result.results || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, loading, error, refetch: fetchData }
}
```

### **2. Filter Logic - Move to Custom Hook**

**Current Issue**: Filter logic mixed with component logic

```typescript
// CURRENT - MIXED RESPONSIBILITIES
useEffect(() => {
  let filtered = results
  if (filters.searchTerm) {
    filtered = filtered.filter(result => 
      result.brand.toLowerCase().includes(searchLower)
    )
  }
  // ... more filtering logic
  setFilteredResults(filtered)
}, [results, filters])
```

**Refactored Solution**:
```typescript
// REFACTORED - SEPARATE HOOK
const useFilteredResults = (results: ScanResult[], filters: FilterState) => {
  return useMemo(() => {
    return results.filter(result => {
      // Search filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase()
        const matchesSearch = 
          result.brand.toLowerCase().includes(searchLower) ||
          result.product.toLowerCase().includes(searchLower) ||
          result.owner.toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }
      
      // Source filter
      if (filters.sourceType !== 'all' && result.source !== filters.sourceType) {
        return false
      }
      
      // Confidence filter
      if (result.confidence < filters.confidenceRange[0] || 
          result.confidence > filters.confidenceRange[1]) {
        return false
      }
      
      return true
    })
  }, [results, filters])
}
```

### **3. Modal State Management - Centralize**

**Current Issue**: Modal state scattered across components

```typescript
// CURRENT - SCATTERED STATE
const [traceModalOpen, setTraceModalOpen] = useState(false)
const [promptModalOpen, setPromptModalOpen] = useState(false)
const [selectedTrace, setSelectedTrace] = useState<ScanResult | null>(null)
const [selectedStage, setSelectedStage] = useState<TraceStage | null>(null)
```

**Refactored Solution**:
```typescript
// REFACTORED - CENTRALIZED MODAL STATE
interface ModalState {
  trace: {
    isOpen: boolean
    selectedResult: ScanResult | null
  }
  prompt: {
    isOpen: boolean
    selectedStage: TraceStage | null
    selectedResult: ScanResult | null
  }
}

const useModalState = () => {
  const [modalState, setModalState] = useState<ModalState>({
    trace: { isOpen: false, selectedResult: null },
    prompt: { isOpen: false, selectedStage: null, selectedResult: null }
  })

  const openTraceModal = useCallback((result: ScanResult) => {
    setModalState(prev => ({
      ...prev,
      trace: { isOpen: true, selectedResult: result }
    }))
  }, [])

  const closeTraceModal = useCallback(() => {
    setModalState(prev => ({
      ...prev,
      trace: { isOpen: false, selectedResult: null }
    }))
  }, [])

  const openPromptModal = useCallback((stage: TraceStage, result: ScanResult) => {
    setModalState(prev => ({
      ...prev,
      prompt: { isOpen: true, selectedStage: stage, selectedResult: result }
    }))
  }, [])

  const closePromptModal = useCallback(() => {
    setModalState(prev => ({
      ...prev,
      prompt: { isOpen: false, selectedStage: null, selectedResult: null }
    }))
  }, [])

  return {
    modalState,
    openTraceModal,
    closeTraceModal,
    openPromptModal,
    closePromptModal
  }
}
```

### **4. API Service Layer - Extract**

**Current Issue**: API calls scattered throughout components

**Refactored Solution**:
```typescript
// NEW FILE: src/lib/eval-v4/apiService.ts
class EvaluationAPIService {
  private baseUrl = '/api/evaluation/v3'

  async getResults(filters?: EvaluationFilters): Promise<ScanResult[]> {
    const params = new URLSearchParams()
    if (filters?.searchTerm) params.append('search', filters.searchTerm)
    if (filters?.confidenceMin) params.append('confidenceMin', filters.confidenceMin.toString())
    if (filters?.source) params.append('dataSource', filters.source)
    
    const response = await fetch(`${this.baseUrl}/results?${params}`)
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }
    
    const data = await response.json()
    return data.results || []
  }

  async rerunEvaluation(resultId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/rerun`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resultId })
    })
    
    if (!response.ok) {
      throw new Error(`Rerun failed: ${response.status}`)
    }
  }

  async submitFeedback(resultId: string, feedback: FeedbackData): Promise<void> {
    const response = await fetch(`${this.baseUrl}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resultId, ...feedback })
    })
    
    if (!response.ok) {
      throw new Error(`Feedback submission failed: ${response.status}`)
    }
  }
}

export const evaluationAPI = new EvaluationAPIService()
```

### **5. Type Definitions - Consolidate**

**Current Issue**: Types scattered across multiple files

**Refactored Solution**:
```typescript
// NEW FILE: src/lib/eval-v4/types.ts
export interface ScanResult {
  id: string
  brand: string
  product: string
  owner: string
  confidence: number
  source: 'live' | 'eval' | 'retry'
  flagged: boolean
  evalSheetEntry: boolean
  trace: TraceStage[]
  timestamp: string
  status: string
  metadata: { [key: string]: any }
}

export interface TraceStage {
  stage: string
  reasoning: string
  confidence: number
  timestamp: string
  promptVersion: string
  agentName: string
  status: 'success' | 'error' | 'pending' | 'warning'
  duration: number
  input: string
  output: string
  prompt: {
    system: string
    user: string
    version: string
  }
  metadata?: {
    alternatives?: string[]
    disambiguation?: string
    ocrText?: string
    imageAnalysis?: {
      detectedText: string[]
      confidence: number
      quality: 'high' | 'medium' | 'low'
    }
    entityValidation?: {
      candidates: Array<{
        name: string
        confidence: number
        source: string
      }>
      selected: string
      reason: string
    }
    fallbackTriggers?: string[]
    lookupResults?: Array<{
      source: string
      result: string
      confidence: number
    }>
    decisions?: string[]
    error?: string
  }
}

export interface FilterState {
  searchTerm: string
  sourceType: 'all' | 'live' | 'eval' | 'retry'
  confidenceRange: [number, number]
}

export interface EvaluationFilters {
  source?: 'live' | 'eval' | 'retry'
  confidenceMin?: number
  confidenceMax?: number
  searchTerm?: string
}

export interface FeedbackData {
  issueType: string
  description: string
  promptFix?: string
}
```

---

## 🏗️ **ARCHITECTURE IMPROVEMENTS**

### **1. Component Structure - Reorganize**

**Current Structure**:
```
src/components/eval-v4/
├── EvalV4Dashboard.tsx (1000+ lines)
├── EvalV4FilterBar.tsx
├── EvalV4ResultRow.tsx
├── EvalV4TraceModal.tsx
├── EvalV4PromptModal.tsx
└── EvalV4BatchToolbar.tsx
```

**Refactored Structure**:
```
src/components/eval-v4/
├── Dashboard/
│   ├── EvalV4Dashboard.tsx (main orchestrator)
│   ├── EvalV4Metrics.tsx (stats cards)
│   └── EvalV4Table.tsx (results table)
├── Filters/
│   ├── EvalV4FilterBar.tsx
│   ├── EvalV4SearchFilter.tsx
│   └── EvalV4AdvancedFilters.tsx
├── Modals/
│   ├── EvalV4TraceModal.tsx
│   ├── EvalV4PromptModal.tsx
│   └── EvalV4FeedbackModal.tsx
├── Actions/
│   ├── EvalV4BatchToolbar.tsx
│   └── EvalV4RowActions.tsx
└── Shared/
    ├── EvalV4ResultRow.tsx
    └── EvalV4LoadingSpinner.tsx
```

### **2. State Management - Implement Context**

**Current Issue**: Props drilling and scattered state

**Refactored Solution**:
```typescript
// NEW FILE: src/lib/eval-v4/EvaluationContext.tsx
interface EvaluationContextType {
  results: ScanResult[]
  filteredResults: ScanResult[]
  loading: boolean
  error: string | null
  filters: FilterState
  modalState: ModalState
  actions: {
    setFilters: (filters: FilterState) => void
    refetchData: () => Promise<void>
    openTraceModal: (result: ScanResult) => void
    closeTraceModal: () => void
    openPromptModal: (stage: TraceStage, result: ScanResult) => void
    closePromptModal: () => void
    rerunEvaluation: (resultId: string) => Promise<void>
    submitFeedback: (resultId: string, feedback: FeedbackData) => Promise<void>
  }
}

const EvaluationContext = createContext<EvaluationContextType | null>(null)

export const EvaluationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: results, loading, error, refetch } = useEvaluationData()
  const { modalState, ...modalActions } = useModalState()
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    sourceType: 'all',
    confidenceRange: [0, 100]
  })
  
  const filteredResults = useFilteredResults(results, filters)
  
  const actions = {
    setFilters,
    refetchData: refetch,
    ...modalActions,
    rerunEvaluation: evaluationAPI.rerunEvaluation,
    submitFeedback: evaluationAPI.submitFeedback
  }
  
  return (
    <EvaluationContext.Provider value={{
      results,
      filteredResults,
      loading,
      error,
      filters,
      modalState,
      actions
    }}>
      {children}
    </EvaluationContext.Provider>
  )
}

export const useEvaluation = () => {
  const context = useContext(EvaluationContext)
  if (!context) {
    throw new Error('useEvaluation must be used within EvaluationProvider')
  }
  return context
}
```

### **3. Error Handling - Centralize**

**Current Issue**: Inconsistent error handling across components

**Refactored Solution**:
```typescript
// NEW FILE: src/lib/eval-v4/errorHandling.ts
export class EvaluationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public retryable: boolean = false
  ) {
    super(message)
    this.name = 'EvaluationError'
  }
}

export const handleAPIError = (error: unknown): EvaluationError => {
  if (error instanceof EvaluationError) {
    return error
  }
  
  if (error instanceof Error) {
    return new EvaluationError(error.message, 'UNKNOWN_ERROR')
  }
  
  return new EvaluationError('An unknown error occurred', 'UNKNOWN_ERROR')
}

export const useErrorHandler = () => {
  const [errors, setErrors] = useState<EvaluationError[]>([])
  
  const handleError = useCallback((error: unknown) => {
    const evaluationError = handleAPIError(error)
    setErrors(prev => [...prev, evaluationError])
    
    // Auto-remove errors after 5 seconds
    setTimeout(() => {
      setErrors(prev => prev.filter(e => e !== evaluationError))
    }, 5000)
  }, [])
  
  const clearErrors = useCallback(() => {
    setErrors([])
  }, [])
  
  return { errors, handleError, clearErrors }
}
```

---

## 🚀 **PERFORMANCE OPTIMIZATIONS**

### **1. Memoization - Add React.memo**

```typescript
// REFACTORED - MEMOIZED COMPONENTS
export const EvalV4ResultRow = React.memo<{ result: ScanResult }>(({ result }) => {
  // Component implementation
})

export const EvalV4FilterBar = React.memo<{ filters: FilterState; onFiltersChange: (filters: FilterState) => void }>(({ filters, onFiltersChange }) => {
  // Component implementation
})
```

### **2. Virtual Scrolling - For Large Datasets**

```typescript
// NEW FILE: src/components/eval-v4/VirtualizedTable.tsx
import { FixedSizeList as List } from 'react-window'

export const VirtualizedTable: React.FC<{ results: ScanResult[] }> = ({ results }) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <EvalV4ResultRow result={results[index]} />
    </div>
  )
  
  return (
    <List
      height={600}
      itemCount={results.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </List>
  )
}
```

### **3. Debounced Search - Optimize API Calls**

```typescript
// NEW FILE: src/hooks/useDebounce.ts
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])
  
  return debouncedValue
}

// USAGE IN FILTER COMPONENT
const debouncedSearchTerm = useDebounce(filters.searchTerm, 300)

useEffect(() => {
  if (debouncedSearchTerm !== filters.searchTerm) {
    refetchData({ searchTerm: debouncedSearchTerm })
  }
}, [debouncedSearchTerm])
```

---

## 📋 **IMPLEMENTATION CHECKLIST**

### **Phase 1: Cleanup (Week 1)**
- [ ] Remove hardcoded test data from EvalV4Dashboard.tsx
- [ ] Delete unused mockData.ts file
- [ ] Remove TODO comments or implement functionality
- [ ] Clean up unused environment variables
- [ ] Consolidate type definitions

### **Phase 2: Refactoring (Week 2)**
- [ ] Extract API service layer
- [ ] Implement custom hooks for data fetching
- [ ] Centralize modal state management
- [ ] Add error handling context
- [ ] Implement filter logic in custom hook

### **Phase 3: Optimization (Week 3)**
- [ ] Add React.memo to components
- [ ] Implement virtual scrolling for large datasets
- [ ] Add debounced search functionality
- [ ] Optimize re-renders with useMemo/useCallback
- [ ] Add loading states and error boundaries

### **Phase 4: Architecture (Week 4)**
- [ ] Reorganize component structure
- [ ] Implement context for state management
- [ ] Add comprehensive error handling
- [ ] Create reusable utility functions
- [ ] Add performance monitoring

---

## 🎯 **SUCCESS METRICS**

### **Performance Improvements**
- [ ] **Bundle size**: Reduce by 20% through code removal
- [ ] **Render time**: Improve by 30% through memoization
- [ ] **API calls**: Reduce by 50% through debouncing
- [ ] **Memory usage**: Reduce by 25% through virtual scrolling

### **Code Quality Improvements**
- [ ] **TypeScript coverage**: Achieve 100% type coverage
- [ ] **Test coverage**: Achieve 80% test coverage
- [ ] **Code duplication**: Reduce by 40% through consolidation
- [ ] **Maintainability**: Improve through better separation of concerns

### **User Experience Improvements**
- [ ] **Loading states**: Add for all async operations
- [ ] **Error handling**: Graceful error display and recovery
- [ ] **Performance**: Smooth scrolling with large datasets
- [ ] **Responsiveness**: Better mobile experience

---

*Last updated: 2025-01-20*  
*Estimated effort: 4 weeks for complete refactoring*  
*Priority: High - will significantly improve maintainability and performance* 