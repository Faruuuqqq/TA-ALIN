# 🔄 Before & After Comparison

## Component Issues Fixed

### 1. MovieCard Component

#### BEFORE ❌
```typescript
interface MovieProps {
  movie: Movie;
  allGenres: string[];
  targetGenres: string[];        // ❌ Unused
  targetVector: number[];
  isLiked: boolean;               // ❌ Never passed by App.tsx
  onToggleLike: () => void;       // ❌ Never passed by App.tsx
}

// Heart button doesn't work
<button onClick={() => onToggleLike()}>
  {isLiked ? '❤️' : '🤍'}        // ❌ Always false
</button>
```

#### AFTER ✅
```typescript
interface MovieProps {
  movie: Movie;
  allGenres: string[];
  targetVector?: number[];       // ✅ Optional with default
  isLiked?: boolean;             // ✅ Optional with default
  onToggleLike?: () => void;     // ✅ Optional with default
  metric?: 'cosine' | 'euclidean' | 'manhattan'; // ✅ NEW
}

// Heart button works with proper state
<button onClick={() => onToggleLike()}>
  {isLiked ? '❤️' : '🤍'}        // ✅ Updates dynamically
</button>
```

---

### 2. ControlsPanel Component

#### BEFORE ❌
```typescript
interface ControlsPanelProps {
  mode: Mode;
  setMode: (mode: Mode) => void;
  availableGenres: string[];
  moodWeights: Record<string, number>;
  toggleGenre: (genre: string) => void;        // ❌ Not in App.tsx
  updateWeight: (genre: string, value: string) => void; // ❌ Not in App.tsx
  queryTitle: string;
  setQueryTitle: (title: string) => void;
  handleSearch: () => void;                    // ❌ Wrong name
  loading: boolean;                            // ❌ Not in App.tsx
  metric: string;                              // ❌ Not in App.tsx
  setMetric: (val: string) => void;           // ❌ Not in App.tsx
  likedMovies: any[];                         // ❌ Not in App.tsx
  onAnalyze: () => void;                      // ❌ Not in App.tsx
  fusionTitleA: string;
  // ... 20+ more props
}
```

#### AFTER ✅
```typescript
interface ControlsPanelProps {
  mode: Mode;
  setMode: (mode: Mode) => void;
  availableGenres: string[];
  moodWeights: Record<string, number>;
  setMoodWeights: (weights: Record<string, number>) => void;
  queryTitle: string;
  setQueryTitle: (title: string) => void;
  onSearch: () => void;                       // ✅ Correct name
  fusionTitleA: string;
  setFusionTitleA: (val: string) => void;
  fusionTitleB: string;
  setFusionTitleB: (val: string) => void;
  fusionRatio: number;
  setFusionRatio: (val: number) => void;
  onFusionSearch: () => void;
  metric?: 'cosine' | 'euclidean' | 'manhattan'; // ✅ NEW
  onMetricChange?: (metric: ...) => void;     // ✅ NEW
}
```

---

### 3. MathModal Component

#### BEFORE ❌
```typescript
// Static cosine formula for all metrics
const formula = `\text{cos}(\theta) = \frac{\mathbf{A} \cdot \mathbf{B}}{\|\mathbf{A}\| \|\mathbf{B}\|}`;

// LaTeX symbols don't render
<p>Dot Product ($\\Sigma$): ...</p>  // ❌ $\Sigma$ not recognized
<p>Magnitude A ($\|A\|$): ...</p>   // ❌ Can't find name A
<p>Magnitude B ($\|B\|$): ...</p>   // ❌ Can't find name B

// Table always shows same columns
<th>Dot Product</th>  // ❌ Wrong for Euclidean/Manhattan
```

#### AFTER ✅
```typescript
// Dynamic formula based on metric
if (metric === 'cosine') {
  mainFormula = `\cos(\theta) = \frac{\mathbf{A} \cdot \mathbf{B}}{\|\mathbf{A}\| \cdot \|\mathbf{B}\|}`;
} else if (metric === 'euclidean') {
  mainFormula = `d(\mathbf{A}, \mathbf{B}) = \sqrt{\sum_{i=1}^{n} (A_i - B_i)^2}`;
} else {
  mainFormula = `d(\mathbf{A}, \mathbf{B}) = \sum_{i=1}^{n} |A_i - B_i|`;
}

// Proper LaTeX rendering
<BlockMath math={`\|\mathbf{A}\| = ${magA.toFixed(4)}`} />  // ✅ Renders correctly
<BlockMath math={`\|\mathbf{B}\| = ${magB.toFixed(4)}`} />  // ✅ Renders correctly

// Dynamic table columns
metric === 'cosine' ? 'Dot Product' : 
metric === 'euclidean' ? '(A-B)²' : '|A-B|'  // ✅ Changes by metric
```

---

## API Error Handling

### BEFORE ❌
```typescript
// App.tsx search
catch (err) {
  setError('Terjadi kesalahan saat mengambil data dari server.');
}

// App.tsx fusion
catch (err) {
  setError('Gagal mengambil data fusion dari server.');
}

// Backend controller
catch (e) {
  return { message: 'Format weights salah. Gunakan JSON.' };
  // ❌ Returns 200 OK with error message
}
```

### AFTER ✅
```typescript
// App.tsx search
catch (err: any) {
  if (err.response?.status === 400) {
    const errorMsg = err.response.data?.message || 'Permintaan tidak valid';
    setError(errorMsg);  // ✅ Server-specific error
  } else if (err.response?.status === 500) {
    setError('Terjadi kesalahan di server. Silakan coba lagi.');
  } else if (err.code === 'ERR_NETWORK') {
    setError('Tidak dapat terhubung ke server...');  // ✅ Network error
  } else {
    setError('Terjadi kesalahan saat mengambil data dari server.');
  }
}

// App.tsx fusion
catch (err: any) {
  // ✅ Input validation first
  if (!fusionTitleA.trim() || !fusionTitleB.trim()) {
    setError('Mohon masukkan kedua judul film.');
    return;
  }
  // ✅ Same error handling as search
}

// Backend controller
if (!weightsParam) {
  throw new BadRequestException({  // ✅ 400 status
    message: 'Parameter weights diperlukan.',
    error: 'MISSING_WEIGHTS',      // ✅ Error code
  });
}

catch (e) {
  if (e instanceof SyntaxError) {
    throw new BadRequestException({  // ✅ Proper exception
      message: 'Format weights salah. Gunakan format JSON yang valid.',
      error: 'INVALID_JSON',
    });
  }
}
```

---

## User Interface

### BEFORE ❌
```typescript
// No loading state indication
// User doesn't know if app is processing

// No error display
// Errors silently fail or appear in console only

// Math modal missing styles
<div className="modal-content">  // ❌ CSS not defined
```

### AFTER ✅
```typescript
// Loading state with animation
{loading && (
  <div className="modal-overlay">
    <div className="loading-overlay-content">
      <div className="spinner">⚙️</div>  // ✅ Rotating emoji
      <h3>Mengkomputasi Matriks...</h3>
    </div>
  </div>
)}

// Error toast notification
{error && (
  <div className="error-notification">  // ✅ Toast popup
    <p>{error}</p>
    <button onClick={onClose}>×</button>
  </div>
)}

// Complete modal styling
.modal-content {
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  // ... more styles
}
```

---

## Type Safety

### BEFORE ❌
```typescript
// Loose typing
interface Movie {
  id: number;
  title: string;
  poster: string;  // ❌ What about posterUrl?
  genres: string[];
  vector: number[];
  similarity_score: string;
}

// API response not typed
const response = await axios.get(url);
// ❌ response.data could be anything

// No error typing
catch (err) {  // ❌ err: any (implicit)
  // ...
}
```

### AFTER ✅
```typescript
// Complete typing
interface Movie {
  id?: number;
  title: string;
  genres: string[];
  poster: string;
  posterUrl?: string;  // ✅ Alternative property
  vector: number[];
  similarity_score: string;
  math_explanation?: string;
}

interface ApiResponse<T> {
  meta: RecommendationMeta;
  data: T[];
  message?: string;
}

// API response typed
const response: AxiosResponse<ApiResponse<Movie>> = await axios.get(url);
// ✅ TypeScript knows exact structure

// Error typing
catch (err: any) {  // ✅ Explicit typing
  if (err.response?.status === 400) {
    // ✅ Can access response properties safely
  }
}
```

---

## Metrics Support

### BEFORE ❌
```typescript
// Metric selector exists but doesn't work
<select value={metric} onChange={(e) => setMetric(e.target.value)}>
  // ❌ metric state doesn't exist in App.tsx
  // ❌ onChange never called
  // ❌ setMetric doesn't exist
</select>

// Metric not sent to API
url = `http://localhost:3000/recommend?title=${encodeURIComponent(queryTitle)}`;
// ❌ No &metric parameter

// Formula always cosine
const formula = `\text{cos}(\theta) = ...`;  // ❌ Static
```

### AFTER ✅
```typescript
// Metric state in App.tsx
const [metric, setMetric] = useState<'cosine' | 'euclidean' | 'manhattan'>('cosine');

// Passed to ControlsPanel
<ControlsPanel
  metric={metric}
  onMetricChange
