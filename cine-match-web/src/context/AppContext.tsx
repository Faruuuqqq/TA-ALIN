import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Movie } from '../interfaces';

interface AppContextType {
  // State
  mode: 'title' | 'mood' | 'fusion';
  setMode: (mode: 'title' | 'mood' | 'fusion') => void;
  
  availableGenres: string[];
  setAvailableGenres: (genres: string[]) => void;
  
  // Title search
  queryTitle: string;
  setQueryTitle: (title: string) => void;
  
  // Mood search
  moodWeights: Record<string, number>;
  setMoodWeights: (weights: Record<string, number>) => void;
  
  // Fusion search
  fusionTitleA: string;
  setFusionTitleA: (val: string) => void;
  fusionTitleB: string;
  setFusionTitleB: (val: string) => void;
  fusionRatio: number;
  setFusionRatio: (val: number) => void;
  
  // Results
  recommendations: Movie[];
  setRecommendations: (movies: Movie[]) => void;
  
  targetVector: number[];
  setTargetVector: (vector: number[]) => void;
  
  // Loading & Error
  loading: boolean;
  setLoading: (loading: boolean) => void;
  
  error: string;
  setError: (error: string) => void;
  
  // Liked movies
  likedMovies: Movie[];
  toggleLikedMovie: (movie: Movie) => void;
  isMovieLiked: (movieId: number | undefined) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<'title' | 'mood' | 'fusion'>('title');
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [queryTitle, setQueryTitle] = useState('');
  const [moodWeights, setMoodWeights] = useState<Record<string, number>>({});
  const [fusionTitleA, setFusionTitleA] = useState('');
  const [fusionTitleB, setFusionTitleB] = useState('');
  const [fusionRatio, setFusionRatio] = useState(0.5);
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [targetVector, setTargetVector] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [likedMovies, setLikedMovies] = useState<Movie[]>([]);

  const toggleLikedMovie = useCallback((movie: Movie) => {
    setLikedMovies(prev => {
      const isLiked = prev.some(m => m.id === movie.id);
      if (isLiked) {
        return prev.filter(m => m.id !== movie.id);
      } else {
        return [...prev, movie];
      }
    });
  }, []);

  const isMovieLiked = useCallback((movieId: number | undefined) => {
    if (movieId === undefined) return false;
    return likedMovies.some(m => m.id === movieId);
  }, [likedMovies]);

  const value: AppContextType = {
    mode, setMode,
    availableGenres, setAvailableGenres,
    queryTitle, setQueryTitle,
    moodWeights, setMoodWeights,
    fusionTitleA, setFusionTitleA,
    fusionTitleB, setFusionTitleB,
    fusionRatio, setFusionRatio,
    recommendations, setRecommendations,
    targetVector, setTargetVector,
    loading, setLoading,
    error, setError,
    likedMovies,
    toggleLikedMovie,
    isMovieLiked,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};
