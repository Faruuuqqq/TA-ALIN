import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
const csv = require('csv-parser');

export interface Movie {
  id: number;
  title: string;
  overview: string;
  posterUrl: string;
  genres: string[];
  keywords: string[];
  rating: number;
  vector: number[];
}

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

    // Pastikan nama file CSV kamu benar di sini
    const csvFilePath = path.join(
      process.cwd(),
      'src',
      'data',
      'movies_dataset.csv',
    );

    return new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (row) => {
          // --- LOGIKA FILTER & CLEANING ---

          // 1. Ambil Vote Count (Handle huruf besar/kecil)
          const voteVal = row.vote_count || row.Vote_Count || '0';
          const voteCount = parseInt(voteVal);

          // Filter: Hanya ambil film yang cukup populer (Vote > 50)
          if (isNaN(voteCount) || voteCount < 100) return;

          // 2. Ambil Genre
          const genreRaw = row.genres || row.Genres;
          if (!genreRaw) return;

          // 3. Ambil Title & Overview
          const title = row.title || row.Title;
          const overview = row.overview || row.Overview;
          if (!title || !overview) return;

          // --- PROCESSING ---
          // Split genre pakai strip (-) sesuai dataset baru
          const genres = genreRaw.split('-').map((g) => g.trim());

          // Ambil keywords
          const keywordRaw = row.keywords || row.Keywords || '';
          const keywords = keywordRaw ? keywordRaw.split('-') : [];

          // Tambahkan ke Set unik
          genres.forEach((g) => uniqueGenres.add(g));

          // Ambil Poster Path
          const posterPath = row.poster_path || row.Poster_Path || '';

          // Ambil Rating
          const ratingVal = row.vote_average || row.Vote_Average || '0';

          rawData.push({
            id: row.id,
            title: title,
            overview: overview,
            // Gabung URL Base + Path Poster
            posterUrl: posterPath ? this.TMDB_BASE_URL + posterPath : '',
            genres: genres,
            keywords: keywords,
            rating: parseFloat(ratingVal) || 0,
          });
        })
        .on('end', () => {
          // Tetapkan Dimensi
          this.genreDimensions = Array.from(uniqueGenres).sort();

          // Vektorisasi Akhir
          this.movies = rawData.map((item) => {
            return {
              ...item,
              // Panggil createVector dengan rating
              vector: this.createVector(item.genres, item.rating),
            };
          });

          resolve(true);
        })
        .on('error', (error) => reject(error));
    });
  }
}
