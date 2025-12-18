export interface Movie {
  id?: number;
  title: string;
  overview?: string;
  genres: string[];
  poster: string;
  posterUrl?: string;
  vector: number[];
  similarity_score: string;
  math_explanation?: string;
}

export interface ApiResponse<T> {
  meta: {
    query?: string | Record<string, number>;
    execution_time?: string;
    algorithm?: string;
    target_vector?: number[];
    query_count?: number;
  };
  data: T[];
  message?: string;
}

export interface RecommendationMeta {
  query?: string | Record<string, number>;
  execution_time?: string;
  algorithm?: string;
  target_vector?: number[];
  query_count?: number;
}
