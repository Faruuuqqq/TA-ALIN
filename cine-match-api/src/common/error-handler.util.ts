/**
 * Error Handler Utility - Centralized error handling
 * Mengeliminasi duplicate error handling logic di controller
 */
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';

export function handleError(error: unknown, context: string): never {
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Handle not found errors
  if (errorMessage.includes('tidak ditemukan')) {
    throw new BadRequestException({
      message: errorMessage,
      error: 'MOVIE_NOT_FOUND',
    });
  }

  // Handle validation errors (title, weights, ratio, etc)
  if (
    errorMessage.includes('Title') ||
    errorMessage.includes('Rasio') ||
    errorMessage.includes('ratio') ||
    errorMessage.includes('Weights') ||
    errorMessage.includes('genre') ||
    errorMessage.includes('movieIds') ||
    errorMessage.includes('movie ID') ||
    errorMessage.includes('Pilih')
  ) {
    throw new BadRequestException({
      message: errorMessage,
      error: 'INVALID_INPUT',
    });
  }

  // Handle JSON parsing errors
  if (error instanceof SyntaxError) {
    throw new BadRequestException({
      message: 'Format data salah. Gunakan format JSON yang valid.',
      error: 'INVALID_JSON',
      details: errorMessage,
    });
  }

  // Generic internal server error
  throw new InternalServerErrorException({
    message: `Terjadi kesalahan saat memproses ${context}`,
    error: 'PROCESSING_ERROR',
    details: errorMessage,
  });
}

/**
 * Specific error handler untuk mood/weights endpoint
 */
export function handleWeightsError(error: unknown): never {
  if (error instanceof SyntaxError) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new BadRequestException({
      message: 'Format weights salah. Gunakan format JSON yang valid.',
      error: 'INVALID_JSON',
      details: errorMessage,
    });
  }

  return handleError(error, 'weights');
}

/**
 * Specific error handler untuk taste profile endpoint
 */
export function handleTasteError(error: unknown): never {
  return handleError(error, 'taste profile');
}

/**
 * Specific error handler untuk fusion endpoint
 */
export function handleFusionError(error: unknown): never {
  return handleError(error, 'fusion');
}
