import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { RecommendationService } from './recommendation/recommendation.service';
import { MovieService } from './movie/movie.service';
import {
  validateLimit,
  validateMetric,
  validateTitle,
  validateJSON,
  validateWeights,
  validateMovieIds,
  validateRatio,
} from './common/validation.util';
import {
  handleError,
  handleWeightsError,
  handleTasteError,
  handleFusionError,
} from './common/error-handler.util';
import {
  formatRecommendations,
  formatRecommendation,
} from './common/response-formatter.util';

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
     const startTime = performance.now();

     try {
       const validatedTitle = validateTitle(title);
       const validatedMetric = validateMetric(metric);
       const validatedLimit = validateLimit(limit, 9);

       const results = this.recommendationService.recommend(
         validatedTitle,
         validatedLimit,
         validatedMetric,
       );

       const endTime = performance.now();

       return {
         meta: {
           query: validatedTitle,
           execution_time: `${(endTime - startTime).toFixed(2)} ms`,
           algorithm: validatedMetric.toUpperCase(),
           total_results: results.length,
         },
         data: formatRecommendations(results, validatedMetric),
       };
     } catch (error) {
       handleError(error, 'rekomendasi');
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
     try {
       if (!weightsParam) {
         throw new Error('Parameter weights diperlukan. Format: {"Action":10,"Comedy":5}');
       }

       const parsedWeights = validateJSON(weightsParam);
       const validatedWeights = validateWeights(parsedWeights);
       const validatedMetric = validateMetric(metric);
       const validatedLimit = validateLimit(limit, 21);

       const { recommendations, queryVector } =
         this.recommendationService.recommendByGenres(
           validatedWeights,
           validatedLimit,
           validatedMetric,
         );

       return {
         meta: {
           query: validatedWeights,
           algorithm: validatedMetric.toUpperCase(),
           target_vector: queryVector,
           total_results: recommendations.length,
         },
         data: formatRecommendations(recommendations, validatedMetric),
       };
     } catch (error) {
       handleWeightsError(error);
     }
   }

   @Post('recommend/taste')
   getRecommendationsByTaste(@Body() body: { movieIds: number[] }) {
     try {
       const validatedMovieIds = validateMovieIds(body.movieIds);

       const results = this.recommendationService.recommendByTasteProfile(
         validatedMovieIds,
       );

       return {
         meta: {
           query_count: validatedMovieIds.length,
           algorithm: 'Vector Centroid (Average)',
           total_results: results.length,
         },
         data: formatRecommendations(
           results,
           'Centroid',
           (movie, score) =>
             `Film ini memiliki kemiripan ${score.toFixed(4)} dengan profil rata-rata seleramu.`,
         ),
       };
     } catch (error) {
       handleTasteError(error);
     }
   }

   @Post('recommend/fusion')
   getRecommendationsByFusion(
     @Body() body: { titleA: string; titleB: string; ratio: number; metric?: string; limit?: number },
   ) {
     try {
       const validatedTitleA = validateTitle(body.titleA);
       const validatedTitleB = validateTitle(body.titleB);
       const validatedRatio = validateRatio(body.ratio);
       const validatedMetric = validateMetric(body.metric || 'cosine');
       const validatedLimit = validateLimit(body.limit, 12);

       const { recommendations, fusionVector } =
         this.recommendationService.recommendByFusion(
           validatedTitleA,
           validatedTitleB,
           validatedRatio,
           validatedLimit,
           validatedMetric,
         );

       return {
         meta: {
           query: {
             film_a: validatedTitleA,
             film_b: validatedTitleB,
             ratio: `${(validatedRatio * 100).toFixed(0)}% : ${(
               (1 - validatedRatio) *
               100
             ).toFixed(0)}%`,
           },
           algorithm: `Linear Combination (${validatedMetric.toUpperCase()})`,
           target_vector: fusionVector,
           total_results: recommendations.length,
         },
         data: formatRecommendations(
           recommendations,
           validatedMetric,
           (movie, score) =>
             `Film ini ${score.toFixed(4)} mirip dengan hasil "fusion" ${validatedTitleA} & ${validatedTitleB}.`,
         ),
       };
     } catch (error) {
       handleFusionError(error);
     }
   }
}
