// src/recommendation/recommendation.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { MovieService } from '../movie/movie.service';
import { LinearAlgebraService } from '../math/linear-algebra.service';
import { Movie } from '../movie/movie.interface';

// Interface untuk output hasil rekomendasi
export interface RecommendationResult {
  movie: Movie;
  score: number; // Nilai Cosine Similarity (0.0 - 1.0)
}

@Injectable()
export class RecommendationService {
  constructor(
    private readonly movieService: MovieService,
    private readonly mathService: LinearAlgebraService,
  ) {}

  /**
   * Fungsi utama: Mencari film mirip berdasarkan Judul
   */
  recommend(
    targetTitle: string,
    limit: number = 12,
    metric: 'cosine' | 'euclidean' | 'manhattan' = 'cosine',
  ): RecommendationResult[] {
    // 1. Ambil semua data film
    const allMovies = this.movieService.getMovies();

    // 2. Cari film target (Case insensitive)
    const targetMovie = allMovies.find(
      (m) => m.title.toLowerCase() === targetTitle.toLowerCase(),
    );

    if (!targetMovie) {
      throw new NotFoundException(
        `Film dengan judul "${targetTitle}" tidak ditemukan!`,
      );
    }

    console.log(`🔎 Mencari rekomendasi untuk: ${targetMovie.title}`);
    console.log(`   Vektor Target: [${targetMovie.vector.join(', ')}]`);

    // 3. HITUNG SIMILARITY (Looping ke semua film)
    // Ini penerapan Aljabar Linear: Membandingkan satu vektor dengan n vektor lainnya
    const scoredMovies = allMovies
      .filter((m) => m.id !== targetMovie.id) // Jangan bandingkan dengan diri sendiri
      .map((movie) => {
        let score = 0;

        // Pilih Rumus Sesuai Request
        if (metric === 'euclidean') {
          // Untuk distance, semakin kecil semakin bagus.
          // Biar sorting-nya gampang (descending), kita balik nilainya: 1 / (1 + distance)
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

        return {
          movie: movie,
          score: score,
        };
      });

    // 4. SORTING / RANKING
    // Urutkan dari score terbesar (paling mirip) ke terkecil
    scoredMovies.sort((a, b) => b.score - a.score);

    // 5. Ambil Top N
    return scoredMovies.slice(0, limit);
  }

  recommendByGenres(
    genreWeights: Record<string, number>,
    limit: number = 20,
    metric: 'cosine' | 'euclidean' | 'manhattan' = 'cosine',
  ): { recommendations: RecommendationResult[]; queryVector: number[] } {
    // Panggil fungsi createWeightedVector yang baru kita buat
    const queryVector = this.movieService.createWeightedVector(genreWeights);

    console.log(`🔎 Mencari rekomendasi Weighted Mood...`);

    const allMovies = this.movieService.getMovies();

    const scoredMovies = allMovies
      .map((movie) => {
        let score = 0;

        // Pilih Rumus Sesuai Request
        if (metric === 'euclidean') {
          // Untuk distance, semakin kecil semakin bagus.
          // Biar sorting-nya gampang (descending), kita balik nilainya: 1 / (1 + distance)
          const dist = this.mathService.euclideanDistance(
            queryVector,
            movie.vector,
          );
          score = 1 / (1 + dist);
        } else if (metric === 'manhattan') {
          const dist = this.mathService.manhattanDistance(
            queryVector,
            movie.vector,
          );
          score = 1 / (1 + dist);
        } else {
          // Default: Cosine Similarity
          score = this.mathService.cosineSimilarity(queryVector, movie.vector);
        }

        return { movie, score };
      })
      .sort((a, b) => b.score - a.score);

    return {
      recommendations: scoredMovies.slice(0, limit),
      queryVector: queryVector,
    };
  }

  /**
   * FITUR BARU: Rekomendasi berdasarkan kumpulan film (Centroid)
   */
  recommendByTasteProfile(
    movieIds: number[],
    limit: number = 12,
  ): RecommendationResult[] {
    const allMovies = this.movieService.getMovies();

    // 1. Ambil object film berdasarkan ID yang dikirim
    const selectedMovies = allMovies.filter((m) => movieIds.includes(m.id));

    if (selectedMovies.length === 0) {
      throw new Error('Tidak ada film yang dipilih valid.');
    }

    console.log(`🧠 Menganalisis selera dari ${selectedMovies.length} film...`);

    // 2. HITUNG CENTROID (RATA-RATA VEKTOR)
    const dimensions = selectedMovies[0].vector.length;
    const centroidVector = new Array(dimensions).fill(0);

    // Penjumlahan Vektor (Vector Addition)
    selectedMovies.forEach((movie) => {
      movie.vector.forEach((val, i) => {
        centroidVector[i] += val;
      });
    });

    // Pembagian Skalar (Scalar Division)
    // Rata-rata = Total / Jumlah Film
    const averageVector = centroidVector.map(
      (val) => val / selectedMovies.length,
    );

    // 3. Cari film terdekat dengan Centroid
    const scoredMovies = allMovies
      // Filter: Jangan rekomendasikan film yang sudah dipilih user (kan udah nonton)
      .filter((m) => !movieIds.includes(m.id))
      .map((movie) => {
        const score = this.mathService.cosineSimilarity(
          averageVector,
          movie.vector,
        );
        return { movie, score };
      })
      .sort((a, b) => b.score - a.score);

    return scoredMovies.slice(0, limit);
  }

  recommendByFusion(
    titleA: string,
    titleB: string,
    ratio: number,
    limit: number = 12,
  ): { recommendations: RecommendationResult[]; fusionVector: number[] } {
    const allMovies = this.movieService.getMovies();

    const movieA = allMovies.find(
      (m) => m.title.toLowerCase() === titleA.toLowerCase(),
    );
    const movieB = allMovies.find(
      (m) => m.title.toLowerCase() === titleB.toLowerCase(),
    );

    if (!movieA || !movieB) {
      throw new NotFoundException(
        'Salah satu atau kedua film tidak ditemukan.',
      );
    }

    // 1. Hitung Vektor Campuran (Linear Combination)
    const fusionVector = movieA.vector.map((val, i) => {
      return val * ratio + movieB.vector[i] * (1 - ratio);
    });

    // 2. Cari film yang paling mirip dengan fusionVector
    const scoredMovies = allMovies
      .filter((m) => m.id !== movieA.id && m.id !== movieB.id) // Exclude the source movies
      .map((movie) => {
        const score = this.mathService.cosineSimilarity(
          fusionVector,
          movie.vector,
        );
        return { movie, score };
      })
      .sort((a, b) => b.score - a.score);

    return {
      recommendations: scoredMovies.slice(0, limit),
      fusionVector,
    };
  }
}
