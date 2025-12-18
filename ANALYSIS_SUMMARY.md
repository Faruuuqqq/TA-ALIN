# CineMatch Codebase Analysis - Executive Summary

## Quick Overview

**Project**: CineMatch - Linear Algebra-Based Movie Recommendation System  
**Analysis Date**: December 18, 2025  
**Total Code Files**: 22 (12 backend, 10 frontend)  
**Total Lines**: ~1,500+ (production code)

---

## THE 3 SIMILARITY CALCULATION METHODS

### 1. **Cosine Similarity** (Default - Most Used)
- **Formula**: `cos(θ) = (A · B) / (||A|| × ||B||)`
- **Range**: [0, 1] where 1 = identical vectors
- **Best For**: Angle/direction matching
- **Implementation**: `LinearAlgebraService.cosineSimilarity()`
- **Location**: `src/math/linear-algebra.service.ts:41-52`
- **Frontend Display**: Fully implemented in MathModal.tsx with KaTeX rendering

### 2. **Euclidean Distance** (L2 Norm)
- **Formula**: `d(A,B) = √(Σ(A_i - B_i)²)` → normalized as `1/(1+distance)`
- **Range**: [0, 1] normalized
- **Best For**: Straight-line distance measurements
- **Implementation**: `LinearAlgebraService.euclideanDistance()`
- **Location**: `src/math/linear-algebra.service.ts:59-66`
- **Frontend Display**: Fully implemented in MathModal.tsx with KaTeX rendering

### 3. **Manhattan Distance** (L1 Norm / Taxicab)
- **Formula**: `d(A,B) = Σ|A_i - B_i|` → normalized as `1/(1+distance)`
- **Range**: [0, 1] normalized
- **Best For**: Grid-based/component-wise distance
- **Implementation**: `LinearAlgebraService.manhattanDistance()`
- **Location**: `src/math/linear-algebra.service.ts:73-79`
- **Frontend Display**: Fully implemented in MathModal.tsx with KaTeX rendering

### Method Integration Flow
```
User selects metric in UI (ControlsPanel.tsx)
         ↓
Sent to backend API endpoint
         ↓
RecommendationService uses metric
         ↓
SimilarityCalculatorService dispatches to method
         ↓
LinearAlgebraService performs calculation
         ↓
Result normalized to [0,1] range
         ↓
Returned to frontend for display
         ↓
MathModal.tsx renders with LaTeX formulas
```

---

## CODE REDUNDANCY ANALYSIS

### 8 Major Redundancy Issues

| # | Issue | Severity | Lines | Location |
|---|-------|----------|-------|----------|
| 1 | Error handling duplication | Moderate | 80+ | app.controller.ts |
| 2 | Response formatting | Moderate | 60+ | app.controller.ts |
| 3 | Dot product calculation | Minor | 20+ | MathModal vs LinearAlgebraService |
| 4 | Magnitude calculation | Minor | 15+ | MathModal vs LinearAlgebraService |
| 5 | Genre filtering logic | Minor | 10+ | ControlsPanel, MathModal |
| 6 | Validation logic | Moderate | 30+ | Multiple files |
| 7 | Movie filtering patterns | Minor | 10+ | RecommendationService methods |
| 8 | State management | Moderate | 40+ | App.tsx vs AppContext.tsx |

**Total Redundant Code**: ~265 lines (8.5% of production code)

### Critical Redundancy: Error Handling
All 4 endpoints repeat similar error handling:
```typescript
try {
  // validation & processing
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  if (errorMessage.includes('tidak ditemukan')) {
    throw new BadRequestException({...});
  }
  // ... 3-5 more if conditions
  throw new InternalServerErrorException({...});
}
```

**Solution**: Extract to reusable error handler utility

### Critical Redundancy: Response Formatting
All 4 endpoints repeat similar response transformation:
```typescript
return {
  meta: { query, algorithm, total_results },
  data: results.map((res) => ({
    title: res.movie.title,
    overview: res.movie.overview,
    genres: res.movie.genres,
    similarity_score: res.score.toFixed(4),
    poster: res.movie.posterUrl,
    vector: res.movie.vector,
    math_explanation: `...`,
  })),
};
```

**Solution**: Create response formatter service

---

## BUGS IDENTIFIED (5 TOTAL)

### Bug #1: Movie Interface Type Mismatch ⚠️ CRITICAL
**Severity**: MODERATE  
**Type**: Type Safety Issue

**Problem**:
- Backend defines: `posterUrl: string`
- Frontend defines: `poster: string` AND `posterUrl?: string`
- Backend defines: `overview: string` (required)
- Frontend defines: `overview?: string` (optional)

**Current Workaround**: `movie.poster || movie.posterUrl` (line 31 in MovieCard.tsx)

**Risk**: Type safety violations, potential runtime errors

**Fix**: Unify interfaces - use `posterUrl` consistently

### Bug #2: Unused Method in SimilarityCalculatorService ❌
**Severity**: MINOR  
**Type**: Dead Code

**Problem**: `validateVectors()` method (28 lines) exists but is never called
**Location**: `similarity-calculator.service.ts:104-132`

**Fix**: Remove or integrate into `calculateSimilarity()`

### Bug #3: Fusion Mode Missing Metric Selection 🔴
**Severity**: MODERATE  
**Type**: Incomplete Feature

**Problem**: 
- Fusion recommendations hardcoded to use only cosine similarity
- Lines 143 & 185 in recommendation.service.ts have hardcoded `'cosine'`
- UI doesn't allow metric selection for fusion mode
- `recommendByFusion()` doesn't accept metric parameter

**Current Code**:
```typescript
const similarityResult = this.similarityCalculator.calculateSimilarity(
  fusionVector,
  movie.vector,
  'cosine',  // ← HARDCODED
);
```

**Fix**: Pass metric parameter to `recommendByFusion()`

### Bug #4: CSV Parser Case-Sensitivity Issues 📋
**Severity**: MODERATE  
**Type**: Data Loading

**Problem**: Inconsistent handling of CSV header case sensitivity
```typescript
const voteVal = row.vote_count || row.Vote_Count || '0';  // Good
const genreRaw = row.genres || row.Genres;  // Inconsistent
const title = row.title || row.Title;  // Inconsistent
```

**Impact**: Data loss if CSV headers don't match expected case

**Fix**: Normalize all CSV field lookups consistently

### Bug #5: Vector Dimension Index Assumption 🔍
**Severity**: MINOR  
**Type**: Index Out of Bounds Risk

**Problem**: MathModal assumes rating dimension is at `availableGenres.length`
```typescript
const genreCount = availableGenres.length;
const movieRating = movieVector[genreCount];  // No bounds check!
```

**Risk**: If vector structure changes, displays `undefined` or `NaN`

**Current Mitigation**: Line 178 has `.toFixed(1) || 'N/A'` fallback

---

## CODE QUALITY ISSUES (6 IDENTIFIED)

### Issue #1: Magic Numbers Everywhere 🔢
**Files Affected**: 6 locations
- Default limits: 12, 20, 12, 12
- Vote threshold: 100
- Default mood weight: 5
- Default fusion ratio: 0.5

**Solution**: Create constants file
```typescript
export const CONFIG = {
  DEFAULT_TITLE_LIMIT: 12,
  DEFAULT_MOOD_LIMIT: 20,
  VOTE_COUNT_THRESHOLD: 100,
  DEFAULT_MOOD_WEIGHT: 5,
  DEFAULT_FUSION_RATIO: 0.5,
};
```

### Issue #2: Missing Input Sanitization 🛡️
**Risk**: XSS vulnerabilities
- Movie titles displayed without sanitization
- User inputs directly rendered in some components

**Solution**: Implement HTML escaping utility

### Issue #3: Inconsistent Error Messages 🔤
- Mixed Indonesian/English
- Inconsistent capitalization
- No standard format

### Issue #4: Large Component Files 📦
| Component | Lines | Issues |
|-----------|-------|--------|
| App.tsx | 227 | 8+ responsibilities |
| MathModal.tsx | 293 | 5+ responsibilities |
| ControlsPanel.tsx | 223 | 5+ responsibilities |

**Solution**: Split into smaller, focused components

### Issue #5: No Error Recovery/Retry 🔄
**Problems**:
- Network errors show generic message
- No retry button
- No timeout handling
- No loading state cancellation

### Issue #6: Missing Performance Optimization ⚡
**Issues**:
- No React.memo() usage
- No useMemo() for expensive calculations
- Genre filtering happens on every render
- Match percentage recalculated on every render

---

## ARCHITECTURE STRENGTHS ✅

1. **Clean Separation of Concerns**
   - Math logic isolated in LinearAlgebraService
   - Recommendation logic in RecommendationService
   - Controllers handle only HTTP concerns

2. **Flexible Similarity Methods**
   - 3 algorithms implemented with consistent interface
   - Easy to add new metrics
   - Unified normalization

3. **Good Validation Framework**
   - Centralized validation utilities
   - Type-safe parameter checking
   - Clear error messages

4. **RESTful API Design**
   - Clear endp
