import { useState } from 'react';
import { GenreRadarChart } from './RadarChart';
import { MathModal } from './MathModal';

// Duplicated interface
export interface Movie {
  id: number;
  title: string;
  poster: string;
  genres: string[];
  vector: number[];
  similarity_score: string;
}


interface MovieProps {
  movie: Movie;
  allGenres: string[];
  targetGenres: string[];
  targetVector: number[];
  isLiked?: boolean; // Baru
  onToggleLike?: () => void; // Baru
}

export const MovieCard = ({
  movie,
  allGenres,
  targetGenres,
  targetVector,
  isLiked,
  onToggleLike,
}: MovieProps) => {
  const [showMath, setShowMath] = useState(false);
  const [imgError, setImgError] = useState(false); // State untuk cek error gambar

  // Konversi skor ke persen
  const matchPercent = (parseFloat(movie.similarity_score) * 100).toFixed(0);

  return (
    <>
      <div className="movie-card">
        <div className="poster-wrapper">
          <div className="score-badge">{matchPercent}% Match</div>

          {/* TOMBOL LIKE MENGAMBANG - Hanya tampil jika ada fungsinya */}
          {onToggleLike && (
            <button
              onClick={(e) => {
                e.stopPropagation(); // Biar gak trigger event lain
                onToggleLike();
              }}
              style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                background: isLiked ? '#f43f5e' : 'rgba(0,0,0,0.6)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                cursor: 'pointer',
                fontSize: '1.2rem',
                transition: 'all 0.2s',
                zIndex: 10,
              }}
              title="Tambahkan ke Analisis Selera"
            >
              {isLiked ? '❤️' : '🤍'}
            </button>
          )}

          {/* LOGIKA GAMBAR CERDAS */}
          {!imgError && movie.poster ? (
            <img
              src={movie.poster}
              alt={movie.title}
              className="poster-image"
              onError={() => setImgError(true)} // Kalau error, switch ke fallback
            />
          ) : (
            // Tampilan Fallback kalau gambar rusak/gak ada
            <div className="poster-fallback">
              <div>
                <span
                  style={{
                    fontSize: '3rem',
                    display: 'block',
                    marginBottom: '10px',
                  }}
                >
                  🎬
                </span>
                {movie.title}
              </div>
            </div>
          )}
        </div>

        <div className="card-content">
          <h3>{movie.title}</h3>
          <p className="card-genres">{movie.genres.join(', ')}</p>

          {/* Grafik Mini (Opsional, kalau berat bisa dihide) */}
          {/* <div style={{marginBottom: '10px'}}>
             <GenreRadarChart ... /> 
          </div> */}

          <button className="btn-math" onClick={() => setShowMath(true)}>
            ∑ Lihat Perhitungan
          </button>
        </div>
      </div>

      <MathModal
        isOpen={showMath}
        onClose={() => setShowMath(false)}
        movieTitle={movie.title}
        score={movie.similarity_score}
        movieVector={movie.vector}
        targetVector={targetVector}
        availableGenres={allGenres}
      />
    </>
  );
};