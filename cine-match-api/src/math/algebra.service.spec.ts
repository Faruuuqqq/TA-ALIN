import { Test, TestingModule } from '@nestjs/testing';
import { LinearAlgebraService } from './linear-algebra.service';

describe('LinearAlgebraService', () => {
  let service: LinearAlgebraService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LinearAlgebraService],
    }).compile();

    service = module.get<LinearAlgebraService>(LinearAlgebraService);
  });

  // Test 1: Uji Dot Product (Perkalian Titik)
  it('should calculate Dot Product correctly', () => {
    const vecA = [1, 2, 3];
    const vecB = [4, 5, 6];
    // Manual: (1*4) + (2*5) + (3*6) = 4 + 10 + 18 = 32
    expect(service.dotProduct(vecA, vecB)).toBe(32);
  });

  // Test 2: Uji Magnitude (Panjang Vektor)
  it('should calculate Magnitude correctly', () => {
    const vec = [3, 4]; // Tripel Pythagoras 3-4-5
    expect(service.magnitude(vec)).toBe(5);
  });

  // Test 3: Uji Cosine Similarity (Identik)
  it('should return 1.0 for identical vectors', () => {
    const vecA = [1, 0, 1];
    expect(service.cosineSimilarity(vecA, vecA)).toBeCloseTo(1.0);
  });

  // Test 4: Uji Cosine Similarity (Tegak Lurus/Orthogonal)
  it('should return 0.0 for orthogonal vectors', () => {
    const vecA = [1, 0]; // Arah Kanan
    const vecB = [0, 1]; // Arah Atas
    expect(service.cosineSimilarity(vecA, vecB)).toBeCloseTo(0.0);
  });
});
