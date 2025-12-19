/**
 * Response Formatter Utility - Centralized response formatting
 * Mengeliminasi duplicate response formatting logic di controller
 */
import { Movie } from '../movie/movie.interface';

export interface RecommendationResponse {
  id: number;
  title: string;
  overview: string;
  genres: string[];
  similarity_score: string;
  math_explanation: string;
  poster: string;
  vector: number[];
}

export interface MetaResponse {
  query?: any;
  algorithm?: string;
  execution_time?: string;
  total_results: number;
  [key: string]: any;
}

/**
 * Format rekomendasi hasil calculation untuk response
 * @param movie - Movie object dari database
 * @param score - Similarity score (0-1)
 * @param metric - Metrik yang digunakan
 * @param explanation - (Optional) Custom explanation text
 */
export function formatRecommendation(
  movie: Movie,
  score: number,
  metric: string,
  explanation?: string,
): RecommendationResponse {
  return {
    id: movie.id,
    title: movie.title,
    overview: movie.overview,
    genres: movie.genres,
    similarity_score: score.toFixed(4),
    math_explanation:
      explanation || `Skor ${score.toFixed(4)} menggunakan metode ${metric}.`,
    poster: movie.posterUrl,
    vector: movie.vector,
  };
}

/**
 * Format batch recommendations
 * @param results - Array dari { movie, score } objects
 * @param metric - Metrik yang digunakan
 * @param explanationFn - Function untuk generate custom explanation per item
 */
export function formatRecommendations(
  results: Array<{ movie: Movie; score: number }>,
  metric: string,
  explanationFn?: (movie: Movie, score: number) => string,
): RecommendationResponse[] {
  return results.map((res) =>
    formatRecommendation(
      res.movie,
      res.score,
      metric,
      explanationFn ? explanationFn(res.movie, res.score) : undefined,
    ),
  );
}
