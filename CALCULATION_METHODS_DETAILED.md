# CineMatch: The 3 Similarity Calculation Methods - Complete Reference

## Table of Contents
1. Cosine Similarity
2. Euclidean Distance
3. Manhattan Distance
4. Implementation Architecture
5. Frontend Integration
6. Visual Examples

---

## 1. COSINE SIMILARITY (Default Method)

### Mathematical Definition
```
cos(θ) = (A · B) / (||A|| × ||B||)

Where:
  A · B = dot product
  ||A|| = magnitude/norm of A
  ||B|| = magnitude/norm of B
```

### Key Properties
- **Range**: [0, 1] where 1 = identical direction, 0 = orthogonal
- **Interpretation**: Measures angle between vectors, not magnitude
- **Use Case**: Best for comparing directions/patterns, ignores scale
- **Computation**: Moderate cost (division operation)
- **Robustness**: Less affected by vector magnitude differences

### Backend Implementation

**File**: `cine-match-api/src/math/linear-algebra.service.ts`

```typescript
cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dot = this.dotProduct(vecA, vecB);
  const magA = this.magnitude(vecA);
  const magB = this.magnitude(vecB);

  // Prevent division by zero
  if (magA === 0 || magB === 0) {
    return 0;
  }

  return dot / (magA * magB);
}

// Helper: Dot Product
dotProduct(vecA: number[], vecB: number[]): number {
  let result = 0;
  for (let i = 0; i < vecA.length; i++) {
    result += vecA[i] * vecB[i];
  }
  return result;
}

// Helper: Magnitude
magnitude(vec: number[]): number {
  let sumOfSquares = 0;
  for (const val of vec) {
    sumOfSquares += val * val;
  }
  return Math.sqrt(sumOfSquares);
}
```

### Integration in Similarity Calculator

**File**: `cine-match-api/src/recommendation/similarity-calculator.service.ts` (line 48)

```typescript
switch (metric) {
  case 'cosine':
    score = this.mathService.cosineSimilarity(vectorA, vectorB);
    break;
  // ...
}

// Result already in [0, 1] range - no normalization needed
return {
  score: Math.max(0, Math.min(1, score)),
  metric,
};
```

### Real Movie Example

**Scenario**: Finding movies similar to "Inception"

```
Movies Dataset (simplified - 5 genres + rating):
  Inception: [1, 1, 0, 0, 0.8]  (Drama, Sci-Fi, Rating: 0.8)
  Interstellar: [1, 1, 0, 0, 0.8]
  Memento: [0, 1, 1, 0, 0.7]
  Gladiator: [1, 0, 0, 1, 0.8]

Dimensions: [Drama, Sci-Fi, Thriller, Action, Rating]

Calculating: Cosine Similarity(Inception, Interstellar)

Step 1: Dot Product
  (1×1) + (1×1) + (0×0) + (0×0) + (0.8×0.8)
  = 1 + 1 + 0 + 0 + 0.64
  = 2.64

Step 2: Magnitudes
  ||Inception|| = √(1² + 1² + 0² + 0² + 0.8²)
                = √(1 + 1 + 0.64)
                = √2.64
                ≈ 1.625

  ||Interstellar|| = √2.64 ≈ 1.625

Step 3: Result
  cos(θ) = 2.64 / (1.625 × 1.625)
         = 2.64 / 2.640625
         ≈ 1.0 (Nearly identical!)

Match Score: 100% (almost perfect match)
```

### Frontend Display

**File**: `cine-match-web/src/components/MathModal.tsx`

```typescript
// Lines 41-52: Cosine calculation display
if (metric === 'cosine') {
  mainFormula = `\cos(\theta) = \frac{\mathbf{A} \cdot \mathbf{B}}{\|\mathbf{A}\| \cdot \|\mathbf{B}\|}`;
  formulaExplanation = 'Cosine Similarity menghitung sudut antara dua vektor...';
  calculation1 = `\mathbf{A} \cdot \mathbf{B} = ${dotProductCalc.toFixed(4)}`;
  calculation2 = `\|\mathbf{A}\| = ${magA.toFixed(4)}, \quad \|\mathbf{B}\| = ${magB.toFixed(4)}`;
  finalCalculation = `\text{Hasil} = \frac{${dotProductCalc.toFixed(4)}}{${magA.toFixed(4)} \times ${magB.toFixed(4)}} = ${cosineSimilarity.toFixed(4)}`;
}

// Rendered using BlockMath from react-katex
<BlockMath math={mainFormula} />
```

---

## 2. EUCLIDEAN DISTANCE (L2 Norm)

### Mathematical Definition
```
d(A, B) = √(Σ(A_i - B_i)²)

Converted to Similarity (for comparison):
  similarity = 1 / (1 + distance)

Where:
  1 / (1 + d) ensures result in [0, 1] range
  Smaller distance = larger similarity
```

### Key Properties
- **Range**: [0, 1] after normalization (1 = identical, 0 = very different)
- **Interpretation**: Straight-line distance in N-dimensional space
- **Use Case**: Precise similarity, considers both direction and magnitude
- **Computation**: Higher cost (square root calculation)
- **Robustness**: Sensitive to magnitude differences
- **Geometric Meaning**: Hypotenuse of right triangle in N dimensions

### Backend Implementation

**File**: `cine-match-api/src/math/linear-algebra.service.ts`

```typescript
euclideanDistance(vecA: number[], vecB: number[]): number {
  let sum = 0;
  for (let i = 0; i < vecA.length; i++) {
    const diff = vecA[i] - vecB[i];
    sum += diff * diff;  // Square the difference
  }
  return Math.sqrt(sum);  // Take square root
}
```

### Integration in Similarity Calculator

**File**: `similarity-calculator.service.ts` (lines 51-58)

```typescript
case 'euclidean':
  // Euclidean distance - semakin kecil semakin mirip
  const euclideanDist = this.mathService.euclideanDistance(
    vectorA,
    vectorB,
  );
  // Convert distance to similarity score [0, 1]
  score = 1 / (1 + euclideanDist);
  break;
```

### Real Movie Example

**Scenario**: Finding movies similar to "Inception"

```
Vectors:
  Inception: [1, 1, 0, 0, 0.8]
  Memento: [0, 1, 1, 0, 0.7]

Calculating: Euclidean Distance

Step 1: Component-wise differences
  (1-0)² = 1² = 1
  (1-1)² = 0² = 0
  (0-1)² = (-1)² = 1
  (0-0)² = 0² = 0
  (0.8-0.7)² = 0.1² = 0.01

Step 2: Sum and square root
  sum = 1 + 0 + 1 + 0 + 0.01 = 2.01
  distance = √2.01 ≈ 1.418

Step 3: Normalize to similarity
  similarity = 1 / (1 + 1.418)
            = 1 / 2.418
            ≈ 0.414

Match Score: 41.4% (moderate match)
```

### Visualization

```
In 2D space (drama vs sci-fi):
  Inception (1, 1)     Interstellar (1, 1)
       |                    |
       |                    |
  _____|_____         ______|______
 |     |     |       |      |      |
       |                    |
  
  Memento (0, 1)
       |
       |
  _____|_____
 |     |     |

Euclidean distance: straight line distance
  Inception to Memento: √((1-0)² + (1-1)²) = √1 = 1.0 unit away
  Inception to Interstellar: √((1-1)² + (1-1)²) = 0 units (identical)
```

### Frontend Display

**File**: `MathModal.tsx` (lines 72-77)

```typescript
if (metric === 'euclidean') {
  mainFormula = `d(\mathbf{A}, \mathbf{B}) = \sqrt{\sum_{i=1}^{n} (A_i - B_i)^2}`;
  formulaExplanation = 'Euclidean Distance adalah jarak garis lurus...';
  calculation1 = `\text{Jarak Euclidean} = ${euclideanDist.toFixed(4)}`;
  calculation2 = `\text{Score} = \frac{1}{1 + d} = \frac{1}{1 + ${euclideanDist.toFixed(4)}}`;
  finalCalculation = `\text{Hasil} = ${euclideanScore.toFixed(4)}`;
}
```

---

## 3. MANHATTAN DISTANCE (L1 Norm / Taxicab)

### Mathematical Definition
```
d(A, B) = Σ|A_i - B_i|

Converted to Similarity:
  similarity = 1 / (1 + distance)

Where:
  |x| = absolute value
  No square root (simpler calculation)
```

### Key Properties
- **Range**: [0, 1] after normalization
- **Interpretation**: Sum of absolute differences (like city blocks)
- **Use Case**: Grid-based comparison, component-wise matching
- **Computation**: Lowest cost (just absolute values)
- **Robustness**: Component-wise evaluation
- **Geometric Meaning**: Distance traveling only horizontally/vertically (like city streets)

### Backend Implementation

**File**: `linear-algebra.service.ts`

```typescript
manhattanDistance(vecA: number[], vecB: number[]): number {
  let sum = 0;
  for (let i = 0; i < vecA.length; i++) {
    sum += Math.abs(vecA[i] - vecB[i]);  // Absolute difference
  }
  return sum;  // No square root needed
}
```

### Integration in Similarity Calculator

**File**: `similarity-calculator.service.ts` (lines 61-68)

```typescript
case 'manhattan':
  // Manhattan distance - semakin kecil semakin mirip
  const manhattanDist = this.mathService.manhattanDistance(
    vectorA,
    vectorB,
  );
  // Convert distance to similarity score [0, 1]
  score = 1 / (1 + manhattanDist);
  break;
```

### Real Movie Example

**Scenario**: Finding movies similar to "Inception"

```
Vectors:
  Inception: [1, 1, 0, 0, 0.8]
  Memento: [0, 1, 1, 0, 0.7]

Calculating: Manhattan Distance

Step 1: Absolute differences
 
