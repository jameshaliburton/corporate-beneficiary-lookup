# Test Suite for Results-Narrative-Refactor

This comprehensive test suite validates the new narrative generation system and UI rewrite for the OwnedBy app.

## 🧪 Test Structure

The test suite is organized into four main categories:

### 📁 Test Categories

- **`@narrative`** - Tests for narrative generation logic and template selection
- **`@ui`** - Tests for UI rendering, visual elements, and fallback handling
- **`@pipeline`** - Tests for pipeline data flow and integration
- **`@fallback`** - Tests for error handling and resilience

### 📂 File Organization

```
src/tests/
├── narrative/
│   ├── generateNarrativeFromResult.unit.test.ts
│   └── templateSelection.logic.test.ts
├── ui/
│   ├── ProductResultV2.render.test.tsx
│   ├── flagsAndHeadlines.visual.test.tsx
│   └── fallbackText.test.tsx
├── pipeline/
│   ├── manualInput.test.ts
│   ├── visionInput.test.ts
│   ├── ragIntegration.test.ts
│   └── sessionStorageKey.test.ts
├── fallback/
│   ├── llmFailureHandling.test.ts
│   └── partialDataResilience.test.ts
├── jest.config.js
├── setup.ts
├── globalSetup.ts
├── globalTeardown.ts
└── run-tests.js
```

## 🚀 Running Tests

### Install Dependencies

```bash
npm install
```

### Run All Tests

```bash
npm test
```

### Run Tests by Category

```bash
# Narrative tests only
npm run test:narrative

# UI tests only
npm run test:ui

# Pipeline tests only
npm run test:pipeline

# Fallback tests only
npm run test:fallback
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Custom Script

```bash
# Run specific tags
node src/tests/run-tests.js --tag=@narrative --tag=@ui

# Run all tests
node src/tests/run-tests.js
```

## 🧪 Test Coverage

### Narrative Tests (`@narrative`)

- **`generateNarrativeFromResult.unit.test.ts`**
  - Tests proper country emphasis in narratives
  - Validates fallback handling for missing data
  - Ensures confidence information is included
  - Verifies narrative structure consistency

- **`templateSelection.logic.test.ts`**
  - Tests template selection logic across 8+ scenarios
  - Validates branching logic for different ownership types
  - Ensures consistent narrative quality across templates
  - Tests country divergence handling

### UI Tests (`@ui`)

- **`ProductResultV2.render.test.tsx`**
  - Tests component rendering with full/partial data
  - Validates proper field display
  - Ensures graceful handling of missing data
  - Tests component structure integrity

- **`flagsAndHeadlines.visual.test.tsx`**
  - Tests country flag display for multiple countries
  - Validates headline formatting with flags
  - Ensures visual consistency across different scenarios
  - Tests country divergence display

- **`fallbackText.test.tsx`**
  - Tests fallback text for missing data
  - Validates "Not available" vs "Unknown" usage
  - Ensures graceful degradation
  - Tests null/undefined handling

### Pipeline Tests (`@pipeline`)

- **`manualInput.test.ts`**
  - Tests manual brand entry flow
  - Validates data transformation
  - Tests country divergence scenarios
  - Ensures narrative preservation

- **`visionInput.test.ts`**
  - Tests image scan with OCR extraction
  - Validates vision-specific trace data
  - Tests low confidence scenarios
  - Ensures proper error handling

- **`ragIntegration.test.ts`**
  - Tests RAG knowledge base integration
  - Validates enhanced background information
  - Tests conflicting information handling
  - Ensures proper source attribution

- **`sessionStorageKey.test.ts`**
  - Tests sessionStorage data persistence
  - Validates key format consistency
  - Tests data integrity through storage
  - Ensures proper error handling

### Fallback Tests (`@fallback`)

- **`llmFailureHandling.test.ts`**
  - Tests Anthropic API failure scenarios
  - Validates fallback narrative generation
  - Tests various error types (timeout, rate limit, auth)
  - Ensures consistent fallback structure

- **`partialDataResilience.test.ts`**
  - Tests handling of partial ownership data
  - Validates graceful degradation
  - Tests null/undefined value handling
  - Ensures consistent narrative structure

## 🎯 Test Data

The test suite includes comprehensive mock data for various scenarios:

### Brand Examples
- **IKEA** - Local independent brand (Sweden)
- **Lipton** - Global brand with country divergence (UK → Netherlands)
- **Coca-Cola** - Corporate empire brand (US)
- **Ferrari** - Family-owned heritage brand (Italy)
- **CitizenM** - Private company with acquisition history
- **Clave Denia** - Ambiguous ownership scenario

### Test Scenarios
- Full data with high confidence
- Partial data with missing fields
- Low confidence results
- Country divergence cases
- LLM failure scenarios
- Network error conditions

## 🔧 Configuration

### Jest Configuration (`jest.config.js`)
- Test environment: `jsdom`
- TypeScript support with `ts-jest`
- Module name mapping for absolute imports
- Coverage thresholds: 80% across all metrics
- Test timeout: 10 seconds

### Test Setup (`setup.ts`)
- Global mocks for Next.js router and navigation
- SessionStorage and localStorage mocks
- Console method mocking
- Environment variable setup

## 📊 Coverage Requirements

The test suite enforces 80% coverage across:
- **Branches** - 80%
- **Functions** - 80%
- **Lines** - 80%
- **Statements** - 80%

## 🚨 Error Handling

The test suite validates:
- LLM API failures and timeouts
- Network connectivity issues
- Invalid JSON responses
- Missing or corrupted data
- SessionStorage quota exceeded
- Component rendering errors

## 🔍 Debugging

### Enable Console Logging
```typescript
// In test files, restore console for debugging
global.restoreConsole();
```

### View Test Coverage
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

### Run Specific Tests
```bash
# Run a specific test file
npm test -- generateNarrativeFromResult.unit.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="should handle"
```

## 📝 Writing New Tests

### Test Structure
```typescript
describe('@category Test Description', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it('should handle specific scenario', () => {
    // Test implementation
  });
});
```

### Mock Data
Use the provided mock data objects or create new ones following the established patterns.

### Assertions
Focus on:
- Data integrity
- User experience
- Error handling
- Performance
- Accessibility

## 🎯 Success Criteria

The test suite is considered successful when:
- ✅ All tests pass
- ✅ Coverage meets 80% threshold
- ✅ No flaky tests
- ✅ Fast execution (< 30 seconds)
- ✅ Clear error messages
- ✅ Comprehensive scenario coverage

## 🔄 Continuous Integration

The test suite is designed to run in CI/CD pipelines:
- Fast execution
- Deterministic results
- Clear failure reporting
- Coverage reporting
- Parallel execution support
