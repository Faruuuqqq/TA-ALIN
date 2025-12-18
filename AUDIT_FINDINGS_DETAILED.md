# CINEMATCH CODE AUDIT - DETAILED FINDINGS

## Quick Reference

| Issue # | Title | Severity | File | Lines | Impact |
|---------|-------|----------|------|-------|--------|
| 1 | Movie Interface Duplication | CRITICAL | movie.interface.ts, movie.service.ts | 1-15 | Type safety |
| 2 | Duplicate Similarity Logic (4x) | CRITICAL | recommendation.service.ts, MathModal.tsx | 47-79, 101-127, 170-181, 44-57 | DRY violation |
| 3 | Unsafe CSV Loading | CRITICAL | movie.service.ts | 79-145 | Crash risk |
| 4 | Missing Input Validation | CRITICAL | app.controller.ts | 89, 175-180 | Security risk |
| 5 | Duplicate Validation (3x) | HIGH | app.controller.ts | 26, 86, 190 | Maintenance |
| 6 | Hardcoded API URLs | HIGH | App.tsx | 49, 64, 71, 120, 150 | Config |
| 7 | Type Inconsistency | HIGH | interfaces.ts | 1-11 | Type safety |
| 8 | O(n²) Performance | HIGH | recommendation.service.ts | 47-79 | Scalability |
| 9 | Inconsistent Errors | HIGH | recommendation.service.ts | 37-39, 147-149, 201-204 | Error handling |
| 10 | Inefficient Calculations | HIGH | MathModal.tsx | 215-246 | Performance |

---

## CRITICAL ISSUE #1: Movie Interface Duplication

### Locations
```
Backend:
  cine-match-api/src/movie/movie.interface.ts        (Lines 1-9)
  cine-match-api/src/movie/movie.service.ts          (Lines 6-15)
```

### Code Details

**movie.interface.ts:**
```typescript
export interface Movie {
  id: number;
  title: string;
  overview: string;
  posterUrl: string;
  genres: string[];
  vector: number[];
}
```

**movie.service.ts (DIFFERENT):**
```typescript
export interface Movie {
  id: number;
  title: string;
  overview: string;
  posterUrl: string;
  genres: string[];
  keywords: string[];    // ← EXTRA FIELD NOT IN INTERFACE
  rating: number;        // ← EXTRA FIELD NOT IN INTERFACE
  vector: number[];
}
```

### Why This Is Critical

1. **Type Inconsistency**: Code menggunakan 2 versi Movie interface berbeda
2. **Runtime Errors**: Keywords dan rating field tidak ada di interface, tapi used di service
3. **Maintenance Nightmare**: Jika ada perubahan, harus update di 2 tempat
4. **Import Confusion**: Developers tidak tahu interface mana yang harus digunakan

### Recommended Fix

```typescript
// movie.ts (SINGLE SOURCE OF TRUTH)
export interface Movie {
  id: number;
  title: string;
  overview: string;
  posterUrl: string;
  genres: string[];
  keywords?: string[];   // OPTIONAL
  rating?: number;       // OPTIONAL
  vector: number[];
}

// Usage:
import { Movie } from './movie.ts';  // Everywhere
```

---

## CRITICAL ISSUE #2: Duplicate Similarity Calculation Logic

### Locations
```
Backend:
  cine-match-api/src/recommendation/recommendation.service.ts
    - recommend() method          (Lines 47-79)
    - recommendByGenres() method  (Lines 101-127)
    - recommendByTasteProfile()   (Lines 170-181)
    
Frontend:
  cine-match-web/src/components/MathModal.tsx       (Lines 44-57)
```

### Code Pattern (REPEATED 4 TIMES)

**Exact code appears in all 4 locations:**
```typescript
let score = 0;

if (metric === 'euclidean') {
  const dist = this.mathService.euclideanDistance(
    targetMovie.vector,
    movie.vector,
  );
  score = 1 / (1 + dist);
} else if (metric === 'manhattan') {
  const dist = this.mathService.manhattanDistance(
    targetMovie.vector,
    movie.vector,
  );
  score = 1 / (1 + dist);
} else {
  // Default: Cosine Similarity
  score = this.mathService.cosineSimilarity(
    targetMovie.vector,
    movie.vector,
  );
}
```

### Why This Is Critical

1. **DRY Violation**: Same logic repeated 4 times = 4x maintenance cost
2. **Bug Propagation**: If bug found, must fix 4 places or risk inconsistency
3. **Evolution Nightmare**: Any algorithmic improvement must be done 4 times
4. **Testing Burden**: Need to test same logic in 4 different contexts

### Recommended Fix

Create utility service:
```typescript
// similarity-calculator.service.ts
@Injectable()
export class SimilarityCalculatorService {
  constructor(private mathService: LinearAlgebraService) {}

  /**
   * Calculate similarity score between two vectors using specified metric
   * @param vecA - First vector
   * @param vecB - Second vector
   * @param metric - Distance metric to use (cosine, euclidean, manhattan)
   * @returns Similarity score (0-1 range)
   */
  calculate(
    vecA: number[],
    vecB: number[],
    metric: 'cosine' | 'euclidean' | 'manhattan'
  ): number {
    switch (metric) {
      case 'euclidean': {
        const distance = this.mathService.euclideanDistance(vecA, vecB);
        return 1 / (1 + distance);
      }
      case 'manhattan': {
        const distance = this.mathService.manhattanDistance(vecA, vecB);
        return 1 / (1 + distance);
      }
      case 'cosine':
      default:
        return this.mathService.cosineSimilarity(vecA, vecB);
    }
  }
}

// Usage everywhere:
const score = this.similarityCalculator.calculate(vecA, vecB, metric);
```

---

## CRITICAL ISSUE #3: Unsafe CSV Loading

### Location
```
cine-match-api/src/movie/movie.service.ts (Lines 79-145)
```

### Current Code Issues

```typescript
private async loadAndVectorize() {
  const rawData: any[] = [];
  const uniqueGenres = new Set<string>();

  const csvFilePath = path.join(
    process.cwd(),
    'src',
    'data',
    'movies_dataset.csv',
  );  // ← NO FILE EXISTENCE CHECK

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)  // ← WILL CRASH IF FILE MISSING
      .pipe(csv())
      .on('data', (row) => {
        // ISSUE 1: Silent returns - no logging
        const voteVal = row.vote_count || row.Vote_Count || '0';
        const voteCount = parseInt(voteVal);
        if (isNaN(voteCount) || voteCount < 100) return;  // ← SILENT

        // ISSUE 2: HARDCODED MAGIC NUMBER
        const genreRaw = row.genres || row.Genres;
        if (!genreRaw) return;  // ← SILENT

        const title = row.title || row.Title;
        const overview = row.overview || row.Overview;
        if (!title || !overview) return;  // ← SILENT

        // ISSUE 3: All loaded into memory at once
        rawData.push({
          id: row.id,
          title: title,
          overview: overview,
          posterUrl: posterPath ? this.TMDB_BASE_URL + posterPath : '',
          genres: genres,
          keywords: keywords,
          rating: parseFloat(ratingVal) || 0,
        });
      })
      .on('end', () => {
        this.genreDimensions = Array.from(uniqueGenres).sort();
        this.movies = rawData.map((item) => ({
          ...item,
          vector: this.createVector(item.genres, item.rating),
        }));
        resolve(true);
      })
      .on('error', (error) => reject(error));  // ← GENERIC ERROR
  });
}
```

### Why This Is Critical

1. **No File Check**: If CSV missing, application crashes on startup
2. **Silent Failures**: Many `return` statements without logging - impossible to debug
3. **Memory Issues**: Entire CSV loaded into memory, then vectorized - 2x memory usage
4. **No Recovery**: If file corrupted mid-stream, entire operation fails
5. **Unlogged Filtering**: Don't know how many rows are filtered out and why

### Recommended Fix

```typescript
private async loadAndVectorize() {
  const csvFilePath = path.join(process.cwd(), 'src', 'data', 'movies_dataset.csv');

  // STEP 1: Check file exists
  if (!fs.existsSync(csvFilePath)) {
    console.error(`CSV file not found: ${csvFilePath}`);
    console.warn('Initializing with empty movie database');
    this.movies = [];
    this.genreDimensions = [];
    return;
  }

  return new Promise((resolve, reject) => {
    const rawData: any[] = [];
    const uniqueGenres = new Set<string>();
    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        try {
          const processedMovie = this.processMovieRow(row, uniqueGenres);
          if (processedMovie) {
            rawData.push(processedMovie);
            processedCount++;
          } else {
            skippedCount++;
          }
        } catch (err) {
         
