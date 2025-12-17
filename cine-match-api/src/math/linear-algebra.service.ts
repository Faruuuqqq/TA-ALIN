import { Injectable } from '@nestjs/common';

@Injectable()
export class LinearAlgebraService {
  /**
   * Menghitung Dot Product (Hasil Kali Titik) dari dua vektor.
   * Rumus: A . B = (a1 * b1) + (a2 * b2) + ... + (an * bn)
   * Relevansi CP-MK 6: Menghitung hasil kali titik.
   */
  dotProduct(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Dimensi vektor tidak sama! Tidak bisa dihitung.');
    }

    let result = 0;
    for (let i = 0; i < vecA.length; i++) {
      result += vecA[i] * vecB[i];
    }
    return result;
  }

  /**
   * Menghitung Magnitude (Panjang Vektor).
   * Rumus: ||A|| = sqrt(a1^2 + a2^2 + ... + an^2)
   * Relevansi CP-MK 6: Menghitung besar vektor (Norm).
   */
  magnitude(vec: number[]): number {
    let sumOfSquares = 0;
    for (const val of vec) {
      sumOfSquares += val * val;
    }
    return Math.sqrt(sumOfSquares);
  }

  /**
   * Menghitung Cosine Similarity.
   * Rumus: (A . B) / (||A|| * ||B||)
   * Range hasil: 0 (tidak mirip) sampai 1 (sangat mirip/identik).
   * Relevansi CP-MK 6: Sudut antar dua vektor.
   */
  cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dot = this.dotProduct(vecA, vecB);
    const magA = this.magnitude(vecA);
    const magB = this.magnitude(vecB);

    // Mencegah pembagian dengan nol (jika vektor kosong/nol)
    if (magA === 0 || magB === 0) {
      return 0;
    }

    return dot / (magA * magB);
  }

  /**
   * EUCLIDEAN DISTANCE (Jarak Garis Lurus)
   * Rumus: sqrt( sum( (a_i - b_i)^2 ) )
   * Semakin KECIL hasilnya, semakin MIRIP.
   */
  euclideanDistance(vecA: number[], vecB: number[]): number {
    let sum = 0;
    for (let i = 0; i < vecA.length; i++) {
      const diff = vecA[i] - vecB[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }

  /**
   * MANHATTAN DISTANCE (Jarak Blok Kota / L1 Norm)
   * Rumus: sum( |a_i - b_i| )
   * Semakin KECIL hasilnya, semakin MIRIP.
   */
  manhattanDistance(vecA: number[], vecB: number[]): number {
    let sum = 0;
    for (let i = 0; i < vecA.length; i++) {
      sum += Math.abs(vecA[i] - vecB[i]);
    }
    return sum;
  }
}
