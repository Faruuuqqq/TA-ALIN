/**
 * Movie Interface - Single Source of Truth untuk entitas Film
 * Representasi film dalam sistem CineMatch dengan semua atribut yang diperlukan
 */
export interface Movie {
  id: number;
  title: string;
  overview: string;
  posterUrl: string;
  genres: string[];
  keywords?: string[]; // Optional: Kata kunci dari film
  rating?: number; // Optional: Rating 0-10 dari dataset
  vector: number[]; // Vektor matematika R^n untuk similarity calculation
}
