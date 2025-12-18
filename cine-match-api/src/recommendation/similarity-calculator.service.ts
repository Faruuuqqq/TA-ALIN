/**
 * SimilarityCalculator Service
 * Utility service untuk menghitung similarity antara vektor dengan berbagai metrik
 * Mengeliminasi duplicate similarity calculation logic
 */
import { Injectable } from '@nestjs/common';
import { LinearAlgebraService } from '../math/linear-algebra.service';

export type SimilarityMetric = 'cosine' | 'euclidean' | 'manhattan';

export interface SimilarityScore {
  score: number;
  metric: SimilarityMetric;
}

@Injectable()
export class SimilarityCalculatorService {
  constructor(private readonly mathService: LinearAlgebraService) {}

  /**
   * Menghitung similarity score antara dua vektor dengan metrik yang dipilih
   * Hasil selalu dalam range 0-1 (1 = identik, 0 = ortogonal/berbeda)
   *
   * @param vectorA - Vektor pertama (target/query)
   * @param vectorB - Vektor kedua (kandidat)
   * @param metric - Metrik similarity: 'cosine' (default), 'euclidean', atau 'manhattan'
   * @returns SimilarityScore dengan nilai 0-1
   */
  calculateSimilarity(
    vectorA: number[],
    vectorB: number[],
    metric: SimilarityMetric = 'cosine',
  ): SimilarityScore {
    if (!vectorA || !vectorB || vectorA.length === 0 || vectorB.length === 0) {
      return { score: 0, metric };
    }

    if (vectorA.length !== vectorB.length) {
      throw new Error(
        `Vector dimensions mismatch: ${vectorA.length} vs ${vectorB.length}`,
      );
    }

    let score = 0;

    switch (metric) {
      case 'cosine':
        score = this.mathService.cosineSimilarity(vectorA, vectorB);
        break;

      case 'euclidean':
        // Euclidean distance - semakin kecil semakin mirip
        // Convert ke similarity: 1 / (1 + distance)
        const euclideanDist = this.mathService.euclideanDistance(
          vectorA,
          vectorB,
        );
        score = 1 / (1 + euclideanDist);
        break;

      case 'manhattan':
        // Manhattan distance - semakin kecil semakin mirip
        // Convert ke similarity: 1 / (1 + distance)
        const manhattanDist = this.mathService.manhattanDistance(
          vectorA,
          vectorB,
        );
        score = 1 / (1 + manhattanDist);
        break;

      default:
        throw new Error(`Unknown similarity metric: ${metric}`);
    }

    // Clamp score ke [0, 1] untuk konsistensi
    return {
      score: Math.max(0, Math.min(1, score)),
      metric,
    };
  }

  /**
   * Batch calculation: Menghitung similarity antara satu vektor dengan banyak vektor
   * Lebih efisien daripada loop manual di service
   *
   * @param vectorA - Vektor target/query
   * @param vectorsB - Array vektor kandidat
   * @param metric - Similarity metric
   * @returns Array dari similarity scores
   */
  calculateBatchSimilarity(
    vectorA: number[],
    vectorsB: number[][],
    metric: SimilarityMetric = 'cosine',
  ): SimilarityScore[] {
    return vectorsB.map((vectorB) =>
      this.calculateSimilarity(vectorA, vectorB, metric),
    );
  }
}
