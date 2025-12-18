# CODE AUDIT REPORT - CINEMATCH PROJECT

**Date:** December 18, 2025
**Status:** COMPREHENSIVE AUDIT COMPLETED
**Severity Levels:** CRITICAL | HIGH | MEDIUM | LOW

---

## EXECUTIVE SUMMARY

Audit menemukan **15 masalah teknis signifikan** dan **12 masalah minor** di seluruh backend dan frontend CineMatch. 
Fokus utama adalah:
- **Code Redundancy:** Duplikasi logika similarity calculation
- **Type Safety Issues:** Type mismatches dan missing validation
- **Error Handling:** Inconsistent error handling patterns
- **Performance:** Inefficient data processing dan calculations
- **Best Practices:** Violation of SOLID principles dan inconsistent patterns

---

## CRITICAL ISSUES (Harus diperbaiki segera)

### 1. CRITICAL: Movie Interface Duplication

**Location:** 
- `cine-match-api/src/movie/movie.interface.ts` (Lines 1-9)
- `cine-match-api/src/movie/movie.service.ts` (Lines 6-15)

**Problem:**
Interface `Movie` didefinisikan di 2 tempat dengan struktur berbeda:

```typescript
// movie.interface.ts
export interface Movie {
  id: number;
  title: string;
  overview: string;
  posterUrl: string;
  genres: string[];
  vector: number[];
}

// movie.service.ts (BERBEDA)
export interface Movie {
  id: number;
  title: string;
  overview: string;
  posterUrl: string;
  genres: string[];
  keywords: string[];      // ← TAMBAHAN di sini
  rating: number;          // ← TAMBAHAN di sini
  vector: number[];
}
```

**Impact:** 
- HIGH: Ketidakkonsistenan tipe data di seluruh aplikasi
- Frontend dan service menggunakan interface berbeda
- Kemungkinan type errors saat runtime

**Recommendation:**
```typescript
// Satu definisi terpusat
export interface Movie {
  id: number;
  title: string;
  overview: string;
  posterUrl: string;
  genres: string[];
  keywords?: string[];  // Optional
  rating?: number;      // Optional
  vector: number[];
}
```

---

### 2. CRITICAL: Duplicate Similarity Calculation Logic

**Location:**
- `cine-match-api/src/recommendation/recommendation.service.ts` (Lines 47-79)
- `cine-match-api/src/recommendation/recommendation.service.ts` (Lines 101-127)
- `cine-match-api/src/recommendation/recommendation.service.ts` (Lines 170-181)
- `cine-match-web/src/components/MathModal.tsx` (Lines 44-57)

**Problem:**
Logika perhitungan metric (cosine, euclidean, manhattan) **diulang 4 kali** dengan pola identik:

```typescript
// recommendation.service.ts - recommend() method (Lines 52-73)
if (metric === 'euclidean') {
  const dist = this.mathService.euclideanDistance(targetMovie.vector, movie.vector);
  score = 1 / (1 + dist);
} else if (metric === 'manhattan') {
  const dist = this.mathService.manhattanDistance(targetMovie.vector, movie.vector);
  score = 1 / (1 + dist);
} else {
  score = this.mathService.cosineSimilarity(targetMovie.vector, movie.vector);
}

// SAMA PERSIS di recommendByGenres() (Lines 106-123)
// SAMA PERSIS di MathModal.tsx (Lines 44-57)
```

**Impact:**
- CRITICAL: Violation DRY principle
- Maintenance nightmare - bug fix harus dilakukan 4x
- Increased chance of inconsistent behavior

**Recommendation:**
Buat utility function:
```typescript
// math-utils.service.ts
calculateSimilarity(vecA: number[], vecB: number[], metric: string): number {
  if (metric === 'euclidean') {
    const dist = this.mathService.euclideanDistance(vecA, vecB);
    return 1 / (1 + dist);
  } else if (metric === 'manhattan') {
    const dist = this.mathService.manhattanDistance(vecA, vecB);
    return 1 / (1 + dist);
  }
  return this.mathService.cosineSimilarity(vecA, vecB);
}
```

---

### 3. CRITICAL: Unsafe Type Casting

**Location:** `cine-match-api/src/app.controller.ts` (Lines 26, 86, 190)

**Problem:**
```typescript
// Line 26
const validLimit = Math.min(Math.max(parseInt(String(limit), 10) || 9, 1), 50);

// Line 86 (DUPLIKAT)
const validLimit = Math.min(Math.max(parseInt(String(limit), 10) || 21, 1), 50);

// Line 190 (DUPLIKAT)
const validLimit = Math.min(Math.max(parseInt(String(limit), 10) || 12, 1), 50);
```

**Issues:**
1. `parseInt(String(limit), 10)` - Unsafe conversion, tidak perlu `String()` 
2. Validasi limit **diulang 3x** dengan default berbeda (9, 21, 12)
3. Tidak ada validation untuk parameter negatif atau NaN

**Impact:**
- Type safety issues
- Code duplication
- Inconsistent behavior

**Recommendation:**
```typescript
// validation.utils.ts
export function validateLimit(limit: any, defaultLimit: number = 9): number {
  const parsed = parseInt(String(limit), 10);
  if (isNaN(parsed)) return defaultLimit;
  return Math.min(Math.max(parsed, 1), 50);
}

// Usage
const validLimit = validateLimit(limit, 9);
```

---

### 4. CRITICAL: CSV Parsing Error Handling

**Location:** `cine-match-api/src/movie/movie.service.ts` (Lines 79-145)

**Problem:**
```typescript
return new Promise((resolve, reject) => {
  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on('data', (row) => {
      // Multiple returns without proper error handling
      if (isNaN(voteCount) || voteCount < 100) return;
      if (!genreRaw) return;
      if (!title || !overview) return;
    })
    .on('end', () => { resolve(true); })
    .on('error', (error) => reject(error));
});
```

**Issues:**
1. **No file existence check** - CSV mungkin tidak ada
2. **Silent failures** - Banyak `return` dalam data handler tanpa logging
3. **No validation recovery** - Jika CSV corrupted, entire load fails
4. **Memory leak potential** - Large CSV file tidak di-chunk
5. **Hardcoded filter** - `voteCount < 100` tidak configurable

**Impact:**
- Application crashes silently on startup
- Difficult to debug missing data
- No graceful degradation

**Recommendation:**
```typescript
private async loadAndVectorize() {
  const csvFilePath = path.join(process.cwd(), 'src', 'data', 'movies_dataset.csv');
  
  // Check file exists
  if (!fs.existsSync(csvFilePath)) {
    console.error(`CSV file not found: ${csvFilePath}`);
    this.movies = [];
    return;
  }

  return new Promise((resolve, reject) => {
    let processedCount = 0;
    let errorCount = 0;

    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        try {
          const processed = this.processMovieRow(row);
          if (processed) {
            rawData.push(processed);
            processedCount++;
          }
        } catch (err) {
          errorCount++;
          console.warn(`Error processing row ${processedCount + errorCount}:`, err.message);
        }
      })
      .on('end', () => {
        console.log(`✅ Loaded ${processedCount} movies, ${errorCount} errors`);
        resolve(true);
      })
      .on('error', reject);
  });
}
```

---

### 5. CRITICAL: Missing Input Validation

**Location:** `cine-match-api/src/app.controller.ts` (Lines 73-96, 169-194)

**Problem:**
```typescript
// Line 74 - recommends/mood endpoint
const weights = JSON.parse(weightsParam);  // ← NO VALIDATION

if (Object.keys(weights).length === 0) {
  throw new Error('Weights tidak boleh kosong');  // ← GENERIC ERROR
}

// Line 194 - recommend/fusion endpoint
const { titleA, titleB, ratio, limit = 12 } = body;
// ← NO VALIDATION ON titleA, titleB (null/undefined)
// ← NO VALIDATION ON ratio TYPE (could be string)
```

**Issues:**
1. `JSON.parse()` error tidak di-catch properly
2. No validation untuk genre weights (could be negative/string)
3. No type validation untuk ratio (should be number 0-1)
4. No sanitization untuk string inputs (XSS vulnerability risk)

**Impact:**
- Runtime errors tidak handled
- Invalid data bisa masuk database
- Potential injection attacks

**Recommendation:**
```typescript
// validation.dto.ts
export function validateWeights(weights: any): Record<string, number> {
  if (!weights || typeof weights !== 'object') {
    throw new BadRequestException('Weights must be an object');
  }
  
  const validated: Record<string, number> = {};
  for (const [genre, weight] of Object.entries(weights)) {
    if (typeof weight !== 'number' || weight < 0 || weight > 10) {
      throw new BadRequestException(`Invalid weight for ${genre}`);
    }
    validated[genre] = weight;
  }
  return validated;
}
```

---

## HIGH SEVERITY IS
