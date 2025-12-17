import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { RecommendationService } from './recommendation/recommendation.service';
import { MovieService } from './movie/movie.service';

@Controller()
export class AppController {
  constructor(
    private readonly recommendationService: RecommendationService,
    private readonly movieService: MovieService,
  ) {}

  @Get('recommend')
  getRecommendations(
    @Query('title') title: string,
    @Query('metric') metric: 'cosine' | 'euclidean' | 'manhattan' = 'cosine',
  ) {
    if (!title) {
      return {
        message:
          'Mohon masukkan judul film. Contoh: /recommend?title=The Batman',
      };
    }

    const startTime = performance.now(); // Hitung durasi proses (opsional, buat keren-kerenan)

    const results = this.recommendationService.recommend(title, 9, metric);

    const endTime = performance.now();

    // Format response agar rapi
    return {
      meta: {
        query: title,
        execution_time: `${(endTime - startTime).toFixed(2)} ms`,
        algorithm: metric.toUpperCase(), // Info algoritma di response
      },
      data: results.map((res) => ({
        title: res.movie.title,
        genres: res.movie.genres,
        similarity_score: res.score.toFixed(4), // Ambil 4 angka desimal
        // Penjelasan matematis untuk setiap item (Bagus buat demo dosen!)
        math_explanation: `Skor ${res.score.toFixed(
          4,
        )} menggunakan metode ${metric}.`,
        poster: res.movie.posterUrl,
        vector: res.movie.vector,
      })),
    };
  }

  @Get('genres')
  getGenres() {
    return this.movieService.getGenreDimensions();
  }

  // Endpoint 2: Search by Mood
  @Get('recommend/mood')
  getRecommendationsByMood(
    @Query('weights') weightsParam: string,
    @Query('metric') metric: 'cosine' | 'euclidean' | 'manhattan' = 'cosine', // <--- Terima param
  ) {
    try {
      // Frontend akan kirim string JSON: '{"Action":10,"Comedy":5}'
      // Kita parse balik jadi Object
      const weights = JSON.parse(weightsParam);

      const { recommendations, queryVector } =
        this.recommendationService.recommendByGenres(weights, 21, metric);

      return {
        meta: {
          query: weights,
          algorithm: metric.toUpperCase(), // Info algoritma di response
          target_vector: queryVector,
        },
        data: recommendations.map((res) => ({
          title: res.movie.title,
          genres: res.movie.genres,
          similarity_score: res.score.toFixed(4),
          math_explanation: `Skor ${res.score.toFixed(
            4,
          )} menggunakan metode ${metric}.`,
          poster: res.movie.posterUrl,
          vector: res.movie.vector,
        })),
      };
    } catch (e) {
      return { message: 'Format weights salah. Gunakan JSON.' };
    }
  }

  @Post('recommend/taste')
  getRecommendationsByTaste(@Body() body: { movieIds: number[] }) {
    if (!body.movieIds || body.movieIds.length === 0) {
      return { message: 'Pilih minimal 1 film.' };
    }

    const results = this.recommendationService.recommendByTasteProfile(
      body.movieIds,
    );

    return {
      meta: {
        query_count: body.movieIds.length,
        algorithm: 'Vector Centroid (Average)',
      },
      data: results.map((res) => ({
        title: res.movie.title,
        genres: res.movie.genres,
        similarity_score: res.score.toFixed(4),
        poster: res.movie.posterUrl,
        vector: res.movie.vector,
        math_explanation: `Film ini memiliki kemiripan ${res.score.toFixed(
          4,
        )} dengan profil rata-rata seleramu.`,
      })),
    };
  }

  @Post('recommend/fusion')
  getRecommendationsByFusion(
    @Body() body: { titleA: string; titleB: string; ratio: number },
  ) {
    const { titleA, titleB, ratio } = body;
    if (!titleA || !titleB || ratio === undefined) {
      return { message: 'Butuh 2 judul film dan 1 rasio.' };
    }

    const { recommendations, fusionVector } =
      this.recommendationService.recommendByFusion(titleA, titleB, ratio);

    return {
      meta: {
        query: {
          film_a: titleA,
          film_b: titleB,
          ratio: `${(ratio * 100).toFixed(0)}% : ${((1 - ratio) * 100).toFixed(
            0,
          )}%`,
        },
        algorithm: 'Linear Combination (Vector Fusion)',
        target_vector: fusionVector,
      },
      data: recommendations.map((res) => ({
        title: res.movie.title,
        genres: res.movie.genres,
        similarity_score: res.score.toFixed(4),
        poster: res.movie.posterUrl,
        vector: res.movie.vector,
        math_explanation: `Film ini ${res.score.toFixed(
          4,
        )} mirip dengan hasil "fusion" ${titleA} & ${titleB}.`,
      })),
    };
  }
}
