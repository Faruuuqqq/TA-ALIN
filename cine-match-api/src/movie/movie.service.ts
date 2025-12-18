import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Movie } from './movie.interface';
const csv = require('csv-parser');

@Injectable()
export class MovieService implements OnModuleInit {
  private movies: Movie[] = [];
  private genreDimensions: string[] = [];

  private readonly TMDB_BASE_URL = 'https://image.tmdb.org/t/p/w500';

  async onModuleInit() {
    console.log('🔄 Membaca Dataset...');
    await this.loadAndVectorize();
    console.log(`✅ Selesai! Terpilih ${this.movies.length} film berkualitas.`);
    console.log(
      `📊 Dimensi Ruang Vektor: ${this.genreDimensions.length} Genre.`,
    );
  }

  getMovies(): Movie[] {
    return this.movies;
  }

  getGenreDimensions(): string[] {
    return this.genreDimensions;
  }

  public createVector(movieGenres: string[], rating: number = 0): number[] {
    // 1. Bagian Genre
    const vector = new Array(this.genreDimensions.length).fill(0);
    movieGenres.forEach((genre) => {
      const index = this.genreDimensions.indexOf(genre);
      if (index !== -1) vector[index] = 1;
    });

    // 2. Bagian Rating (Dimensi Terakhir) - Normalisasi / 10
    vector.push(rating / 10);

    return vector;
  }

  // Helper untuk mood slider (User input)
  public createWeightedVector(genreWeights: Record<string, number>): number[] {
    const vector = new Array(this.genreDimensions.length).fill(0);
    Object.entries(genreWeights).forEach(([genre, weight]) => {
      const index = this.genreDimensions.indexOf(genre);
      if (index !== -1) vector[index] = weight;
    });
    // Default preferensi rating user dianggap tinggi (0.8)
    vector.push(0.8);
    return vector;
  }

  private async loadAndVectorize() {
    const rawData: any[] = [];
    const uniqueGenres = new Set<string>();

    // Validasi path file CSV
    const csvFilePath = path.join(
      process.cwd(),
      'src',
      'data',
      'movies_dataset.csv',
    );

    // ✅ CHECK 1: Validasi file existence
    if (!fs.existsSync(csvFilePath)) {
      throw new Error(
        `❌ Dataset file not found at: ${csvFilePath}. ` +
          'Please ensure movies_dataset.csv exists in src/data directory.',
      );
    }

    // ✅ CHECK 2: Validasi file is readable
    try {
      fs.accessSync(csvFilePath, fs.constants.R_OK);
    } catch (error) {
      throw new Error(
        `❌ Dataset file exists but not readable: ${csvFilePath}. ` +
          'Check file permissions.',
      );
    }

    return new Promise((resolve, reject) => {
      let rowCount = 0;
      let errorCount = 0;

      const stream = fs.createReadStream(csvFilePath);

      stream
        .pipe(csv())
        .on('data', (row) => {
          rowCount++;

         try {
             // --- LOGIKA FILTER & CLEANING ---

             // 1. Ambil Vote Count dengan case-insensitive header handling
             const voteVal = row['vote_count'] ?? row['Vote_Count'] ?? row['voteCount'] ?? '0';
             const voteCount = parseInt(String(voteVal).trim());

             // Filter: Hanya ambil film yang cukup populer (Vote > 100)
             if (isNaN(voteCount) || voteCount < 100) return;

             // 2. Ambil Genre - REQUIRED FIELD (case-insensitive)
             const genreRaw = row['genres'] ?? row['Genres'];
             if (!genreRaw || String(genreRaw).trim() === '') {
               console.warn(
                 `⚠️  Row ${rowCount}: Missing or empty genres field, skipping.`,
               );
               errorCount++;
               return;
             }

             // 3. Ambil Title & Overview - REQUIRED FIELDS (case-insensitive)
             const title = row['title'] ?? row['Title'];
             const overview = row['overview'] ?? row['Overview'];

             if (!title || !overview) {
               console.warn(
                 `⚠️  Row ${rowCount}: Missing title or overview, skipping.`,
               );
               errorCount++;
               return;
             }

             // Validasi title & overview not empty
             if (String(title).trim() === '' || String(overview).trim() === '') {
               console.warn(
                 `⚠️  Row ${rowCount}: Empty title or overview, skipping.`,
               );
               errorCount++;
               return;
             }

             // --- PROCESSING ---
             // Split genre pakai strip (-) sesuai dataset baru
             const genres = String(genreRaw)
               .split('-')
               .map((g: string) => g.trim())
               .filter((g: string) => g.length > 0);

             if (genres.length === 0) {
               console.warn(`⚠️  Row ${rowCount}: No valid genres found, skipping.`);
               errorCount++;
               return;
             }

             // Ambil keywords (case-insensitive)
             const keywordRaw = row['keywords'] ?? row['Keywords'] ?? '';
             const keywords = keywordRaw
               ? String(keywordRaw).split('-').map((k: string) => k.trim())
               : [];

             // Tambahkan ke Set unik
             genres.forEach((g: string) => uniqueGenres.add(g));

             // Ambil Poster Path (case-insensitive)
             const posterPath = row['poster_path'] ?? row['Poster_Path'] ?? row['posterPath'] ?? '';

             // Ambil Rating - VALIDASI (case-insensitive)
             const ratingVal = row['vote_average'] ?? row['Vote_Average'] ?? row['voteAverage'] ?? '0';
             const rating = parseFloat(String(ratingVal)) || 0;

             if (rating < 0 || rating > 10) {
               console.warn(
                 `⚠️  Row ${rowCount}: Invalid rating value ${rating}, using 0.`,
               );
             }

             rawData.push({
               id: row['id'] || rowCount, // Fallback ke row number jika no ID
               title: String(title).trim(),
               overview: String(overview).trim(),
               posterUrl: posterPath ? this.TMDB_BASE_URL + posterPath : '',
               genres: genres,
               keywords: keywords,
               rating: Math.min(10, Math.max(0, rating)), // Clamp to 0-10
             });
           } catch (error) {
             console.error(
               `❌ Row ${rowCount}: Error processing row:`,
               error instanceof Error ? error.message : String(error),
             );
             errorCount++;
           }
        })
        .on('end', () => {
          // ✅ CHECK 3: Validasi data loaded
          if (rawData.length === 0) {
            return reject(
              new Error(
                '❌ No valid movies found in dataset. ' +
                  'Check CSV format and data quality.',
              ),
            );
          }

          console.log(
            `✅ Loaded ${rawData.length} valid movies (${errorCount} rows skipped).`,
          );

          // Tetapkan Dimensi
          this.genreDimensions = Array.from(uniqueGenres).sort();

          if (this.genreDimensions.length === 0) {
            return reject(
              new Error('❌ No genres found in dataset.'),
            );
          }

          // Vektorisasi Akhir
          this.movies = rawData.map((item) => {
            return {
              ...item,
              vector: this.createVector(item.genres, item.rating),
            };
          });

          resolve(true);
        })
        .on('error', (error: Error) => {
          reject(
            new Error(
              `❌ Error reading CSV file: ${error.message}. ` +
                'Please ensure the file is a valid CSV.',
            ),
          );
        });

      // ✅ CHECK 4: Stream error handling
      stream.on('error', (error: Error) => {
        reject(
          new Error(
            `❌ Stream error while reading dataset: ${error.message}`,
          ),
        );
      });
    });
  }
}
