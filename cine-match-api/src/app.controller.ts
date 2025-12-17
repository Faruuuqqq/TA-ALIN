import { Controller, Get, Query, Post, Body, BadRequestException, InternalServerErrorException } from '@nestjs/common';
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
    @Query('limit') limit: number = 9,
  ) {
    if (!title) {
      throw new BadRequestException({
        message: 'Mohon masukkan judul film. Contoh: /recommend?title=The Batman',
        error: 'MISSING_TITLE',
      });
    }

    // Validate limit
    const validLimit = Math.min(Math.max(parseInt(String(limit), 10) || 9, 1), 50);

    const startTime = performance.now();

    try {
      const results = this.recommendationService.recommend(title, validLimit, metric);

      const endTime = performance.now();

      return {
        meta: {
          query: title,
          execution_time: `${(endTime - startTime).toFixed(2)} ms`,
          algorithm: metric.toUpperCase(),
          total_results: results.length,
        },
        data: results.map((res) => ({
          title: res.movie.title,
          genres: res.movie.genres,
          similarity_score: res.score.toFixed(4),
          math_explanation: `Skor ${res.score.toFixed(4)} menggunakan metode ${metric}.`,
          poster: res.movie.posterUrl,
          vector: res.movie.vector,
        })),
      };
    } catch (error) {
      if (error.message.includes('tidak ditemukan')) {
        throw new BadRequestException({
          message: error.message,
          error: 'MOVIE_NOT_FOUND',
        });
      }
      throw new InternalServerErrorException({
        message: 'Terjadi kesalahan saat memproses rekomendasi',
        error: 'PROCESSING_ERROR',
      });
    }
  }

  @Get('genres')
  getGenres() {
    return this.movieService.getGenreDimensions();
  }

  // Endpoint 2: Search by Mood
  @Get('recommend/mood')
  getRecommendationsByMood(
    @Query('weights') weightsParam: string,
    @Query('metric') metric: 'cosine' | 'euclidean' | 'manhattan' = 'cosine',
    @Query('limit') limit: number = 21,
  ) {
    if (!weightsParam) {
      throw new BadRequestException({
        message: 'Parameter weights diperlukan. Format: {"Action":10,"Comedy":5}',
        error: 'MISSING_WEIGHTS',
      });
    }

    // Validate limit
    const validLimit = Math.min(Math.max(parseInt(String(limit), 10) || 21, 1), 50);

    try {
      const weights = JSON.parse(weightsParam);

      if (Object.keys(weights).length === 0) {
        throw new Error('Weights tidak boleh kosong');
      }

      const { recommendations, queryVector } =
        this.recommendationService.recommendByGenres(weights, validLimit, metric);

      return {
        meta: {
          query: weights,
          algorithm: metric.toUpperCase(),
          target_vector: queryVector,
          total_results: recommendations.length,
        },
        data: recommendations.map((res) => ({
          title: res.movie.title,
          genres: res.movie.genres,
          similarity_score: res.score.toFixed(4),
          math_explanation: `Skor ${res.score.toFixed(4)} menggunakan metode ${metric}.`,
          poster: res.movie.posterUrl,
          vector: res.movie.vector,
        })),
      };
    } catch (e) {
      if (e instanceof SyntaxError) {
        throw new BadRequestException({
          message: 'Format weights salah. Gunakan format JSON yang valid.',
          error: 'INVALID_JSON',
        });
      }
      throw new BadRequestException({
        message: e.message || 'Error memproses weights parameter',
        error: 'WEIGHTS_PROCESSING_ERROR',
      });
    }
  }

  @Post('recommend/taste')
  getRecommendationsByTaste(@Body() body: { movieIds: number[] }) {
    if (!body.movieIds || body.movieIds.length === 0) {
      throw new BadRequestException({
        message: 'Pilih minimal 1 film.',
        error: 'MISSING_MOVIE_IDS',
      });
    }

    try {
      const results = this.recommendationService.recommendByTasteProfile(
        body.movieIds,
      );

      return {
        meta: {
          query_count: body.movieIds.length,
          algorithm: 'Vector Centroid (Average)',
          total_results: results.length,
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
    } catch (error) {
      throw new InternalServerErrorException({
        message: error.message || 'Error memproses taste profile',
        error: 'TASTE_PROCESSING_ERROR',
      });
    }
  }

  @Post('recommend/fusion')
  getRecommendationsByFusion(
    @Body() body: { titleA: string; titleB: string; ratio: number; limit?: number },
  ) {
    const { titleA, titleB, ratio, limit = 12 } = body;

    if (!titleA || !titleB || ratio === undefined) {
      throw new BadRequestException({
        message: 'Butuh 2 judul film dan 1 rasio (0-1).',
        error: 'MISSING_FUSION_PARAMS',
      });
    }

    if (ratio < 0 || ratio > 1) {
      throw new BadRequestException({
        message: 'Rasio harus antara 0 dan 1.',
        error: 'INVALID_RATIO',
      });
    }

    // Validate limit
    const validLimit = Math.min(Math.max(parseInt(String(limit), 10) || 12, 1), 50);

    try {
      const { recommendations, fusionVector } =
        this.recommendationService.recommendByFusion(titleA, titleB, ratio, validLimit);

      return {
        meta: {
          query: {
            film_a: titleA,
            film_b: titleB,
            ratio: `${(ratio * 100).toFixed(0)}% : ${((1 - ratio) * 100).toFixed(0)}%`,
          },
          algorithm: 'Linear Combination (Vector Fusion)',
          target_vector: fusionVector,
          total_results: recommendations.length,
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
    } catch (error) {
      if (error.message.includes('tidak ditemukan')) {
        throw new BadRequestException({
          message: error.message,
          error: 'MOVIE_NOT_FOUND',
        });
      }
      throw new InternalServerErrorException({
        message: 'Error memproses fusion',
        error: 'FUSION_PROCESSING_ERROR',
      });
    }
  }
}
