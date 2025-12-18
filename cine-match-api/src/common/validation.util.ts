/**
 * Validation Utility - Centralized validation logic
 * Menghilangkan duplicate validation code di controller
 */

/**
 * Validate dan normalize limit parameter
 * @param limit - Input limit dari query
 * @param defaultLimit - Default value jika invalid
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Normalized limit value
 */
export function validateLimit(
  limit: any,
  defaultLimit: number = 12,
  min: number = 1,
  max: number = 50,
): number {
  const parsed = parseInt(String(limit), 10) || defaultLimit;
  return Math.min(Math.max(parsed, min), max);
}

/**
 * Validate similarity metric
 * @param metric - Input metric dari query
 * @returns Valid metric atau default 'cosine'
 */
export function validateMetric(
  metric: any,
): 'cosine' | 'euclidean' | 'manhattan' {
  const validMetrics = ['cosine', 'euclidean', 'manhattan'];
  const normalized = String(metric).toLowerCase();

  if (validMetrics.includes(normalized)) {
    return normalized as 'cosine' | 'euclidean' | 'manhattan';
  }

  return 'cosine';
}

/**
 * Validate dan parse JSON string
 * @param jsonString - JSON string to parse
 * @returns Parsed object
 * @throws SyntaxError jika invalid JSON
 */
export function validateJSON<T = any>(jsonString: string): T {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new SyntaxError(
        `Invalid JSON format: ${error.message}. Expected valid JSON object.`,
      );
    }
    throw error;
  }
}

/**
 * Validate weights object dari mood query
 * @param weights - Object dengan genre dan bobot
 * @returns Validated weights object
 * @throws Error jika invalid
 */
export function validateWeights(weights: Record<string, any>): Record<string, number> {
  if (!weights || Object.keys(weights).length === 0) {
    throw new Error('Weights tidak boleh kosong. Format: {"Action":10,"Comedy":5}');
  }

  const validatedWeights: Record<string, number> = {};

  for (const [genre, weight] of Object.entries(weights)) {
    // Validasi genre name
    if (typeof genre !== 'string' || genre.trim().length === 0) {
      throw new Error(`Invalid genre name: ${genre}`);
    }

    // Validasi weight value
    const numWeight = Number(weight);
    if (isNaN(numWeight) || numWeight < 0) {
      throw new Error(
        `Invalid weight for genre "${genre}": ${weight}. Weight must be >= 0.`,
      );
    }

    validatedWeights[genre] = numWeight;
  }

  return validatedWeights;
}

/**
 * Validate title string
 * @param title - Film title
 * @returns Validated title
 * @throws Error jika invalid
 */
export function validateTitle(title: any): string {
  if (!title || typeof title !== 'string') {
    throw new Error('Title harus string non-empty');
  }

  const trimmed = title.trim();
  if (trimmed.length === 0) {
    throw new Error('Title tidak boleh kosong');
  }

  return trimmed;
}

/**
 * Validate movie IDs array
 * @param movieIds - Array of movie IDs
 * @returns Validated movie IDs array
 * @throws Error jika invalid
 */
export function validateMovieIds(movieIds: any): number[] {
  if (!Array.isArray(movieIds)) {
    throw new Error('movieIds harus berupa array');
  }

  if (movieIds.length === 0) {
    throw new Error('Pilih minimal 1 film');
  }

  const validatedIds = movieIds.map((id, index) => {
    const numId = Number(id);
    if (isNaN(numId) || !Number.isInteger(numId) || numId <= 0) {
      throw new Error(`Invalid movie ID at index ${index}: ${id}`);
    }
    return numId;
  });

  return validatedIds;
}

/**
 * Validate ratio parameter (0-1)
 * @param ratio - Ratio value
 * @returns Validated ratio
 * @throws Error jika invalid
 */
export function validateRatio(ratio: any): number {
  const numRatio = Number(ratio);

  if (isNaN(numRatio) || numRatio < 0 || numRatio > 1) {
    throw new Error(`Rasio harus antara 0 dan 1, got: ${ratio}`);
  }

  return numRatio;
}
