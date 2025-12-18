import { useState } from 'react';
import { MathModal } from './MathModal';
import type { Movie } from '../interfaces';

interface MovieProps {
  movie: Movie;
  allGenres: string[];
  targetVector?: number[];
  metric?: 'cosine' | 'euclidean' | 'manhattan';
}

export const MovieCard = ({ 
  movie, 
  allGenres, 
  targetVector = [],
  metric = 'cosine'
}: MovieProps) => {
  const [showMath, setShowMath] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Fallback persentase jika similarity_score string
  const scoreNum = parseFloat(movie.similarity_score);
  const matchPercent = isNaN(scoreNum) ? 0 : (scoreNum * 100).toFixed(0);

  return (
    <>
      <div className="movie-card">
        <div className="poster-wrapper">
          <div className="score-badge">{matchPercent}% Match</div>
          
           {!imgError && (movie.poster || movie.posterUrl) ? (
             <img 
               src={movie.poster || movie.posterUrl} 
               alt={movie.title}
               className="poster-image"
               onError={() => setImgError(true)}
             />
           ) : (
             <div className="poster-fallback">
               <div>
                 {movie.title}
               </div>
             </div>
           )}
        </div>
        
        <div className="card-content">
           <h3>{movie.title}</h3>
           <p className="card-genres">{movie.genres.join(', ')}</p>
           
           {movie.overview && (
             <p className="card-overview">{movie.overview}</p>
           )}
           
           <button className="btn-math" onClick={() => setShowMath(true)}>
             Lihat Perhitungan
           </button>
         </div>
      </div>

      {/* MODAL PERHITUNGAN */}
      <MathModal 
        isOpen={showMath} 
        onClose={() => setShowMath(false)}
        movieTitle={movie.title}
        score={movie.similarity_score}
        movieVector={movie.vector}
        targetVector={targetVector}
        availableGenres={allGenres}
        metric={metric}
      />
    </>
  );
};
