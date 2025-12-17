import { useState, useEffect } from 'react';
import axios from 'axios';
import { MovieCard } from './components/MovieCard';
import { ControlsPanel } from './components/ControlsPanel';
import { ErrorNotification } from './components/ErrorNotification';
import './App.css';

interface Movie {
  id: number;
  title: string;
  poster: string;
  genres: string[];
  vector: number[];
  similarity_score: string;
}

function App() {
  const [mode, setMode] = useState<'title' | 'mood' | 'fusion'>('title');
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);

  // State Input
  const [queryTitle, setQueryTitle] = useState('');
  const [moodWeights, setMoodWeights] = useState<Record<string, number>>({});
  
   // --- State untuk Fitur Fusion ---
   const [fusionTitleA, setFusionTitleA] = useState('');
   const [fusionTitleB, setFusionTitleB] = useState('');
   const [fusionRatio, setFusionRatio] = useState(0.5);
   // --------------------------------

    // State untuk Metric Selection
    const [metric, setMetric] = useState<'cosine' | 'euclidean' | 'manhattan'>('cosine');

    // State untuk Pagination
    const [resultsPerPage, setResultsPerPage] = useState(9);

   // State Output
   const [recommendations, setRecommendations] = useState<Movie[]>([]);
   const [targetVector, setTargetVector] = useState<number[]>([]);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState('');

  useEffect(() => {
    // Clear recommendations when mode changes
    setRecommendations([]);
  }, [mode]);

  useEffect(() => {
    axios.get('http://localhost:3000/genres')
      .then(res => setAvailableGenres(Array.from(new Set(res.data))))
      .catch(() => setError('Tidak dapat memuat daftar genre dari server.'));
  }, []);

   const handleSearch = async () => {
     setLoading(true);
     setError('');
     try {
       let url = '';
       if (mode === 'title') {
         if (!queryTitle.trim()) {
           setLoading(false);
           return;
         }
         url = `http://localhost:3000/recommend?title=${encodeURIComponent(queryTitle.trim())}&metric=${metric}&limit=${resultsPerPage}`;
       } else { // mode === 'mood'
         if (Object.keys(moodWeights).length === 0) {
           setLoading(false);
           return;
         }
         const jsonWeights = JSON.stringify(moodWeights);
         url = `http://localhost:3000/recommend/mood?weights=${encodeURIComponent(jsonWeights)}&metric=${metric}&limit=${resultsPerPage}`;
       }

      const response = await axios.get(url);

      if (!response.data.data || response.data.data.length === 0) {
        setError(mode === 'title' 
          ? `Film dengan judul "${queryTitle}" tidak ditemukan di database.`
          : 'Tidak ada film yang cocok dengan mood yang dipilih.'
        );
        setRecommendations([]);
      } else {
        setRecommendations(response.data.data);

        if (mode === 'mood') {
          const tempVector = availableGenres.map(g => moodWeights[g] || 0);
          setTargetVector(tempVector);
        } else {
          setTargetVector(response.data.meta?.target_vector || response.data.data[0]?.vector || []);
        }
      }
    } catch (err: any) {
      // Handle different error types
      if (err.response?.status === 400) {
        const errorMsg = err.response.data?.message || 'Permintaan tidak valid';
        setError(errorMsg);
      } else if (err.response?.status === 500) {
        setError('Terjadi kesalahan di server. Silakan coba lagi.');
      } else if (err.code === 'ERR_NETWORK') {
        setError('Tidak dapat terhubung ke server. Pastikan server berjalan di http://localhost:3000');
      } else {
        setError('Terjadi kesalahan saat mengambil data dari server.');
      }
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

   const handleFusionSearch = async () => {
     setLoading(true);
     setError('');
     try {
       if (!fusionTitleA.trim() || !fusionTitleB.trim()) {
         setError('Mohon masukkan kedua judul film.');
         setLoading(false);
         return;
       }

       const response = await axios.post(
         'http://localhost:3000/recommend/fusion',
         {
           titleA: fusionTitleA.trim(),
           titleB: fusionTitleB.trim(),
           ratio: parseFloat(fusionRatio.toString()),
           limit: resultsPerPage,
         },
         {
           headers: {
             'Content-Type': 'application/json',
           },
         }
       );
      
      if (!response.data.data || response.data.data.length === 0) {
        setError('Tidak ada hasil fusion yang cocok. Pastikan kedua film ada di database.');
        setRecommendations([]);
      } else {
        setRecommendations(response.data.data);
        setTargetVector(response.data.meta?.target_vector || []);
      }
    } catch (err: any) {
      // Handle different error types
      if (err.response?.status === 400) {
        const errorMsg = err.response.data?.message || 'Permintaan tidak valid';
        setError(errorMsg);
      } else if (err.response?.status === 500) {
        setError('Terjadi kesalahan di server. Silakan coba lagi.');
      } else if (err.code === 'ERR_NETWORK') {
        setError('Tidak dapat terhubung ke server. Pastikan server berjalan di http://localhost:3000');
      } else {
        setError('Gagal mengambil data fusion dari server.');
      }
      console.error('Fusion error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>CineMatch AI</h1>
        <p>Sistem Rekomendasi Aljabar Linear Menggunakan Vector Space Model</p>
      </header>

      <ControlsPanel
        mode={mode}
        setMode={setMode}
        queryTitle={queryTitle}
        setQueryTitle={setQueryTitle}
        availableGenres={availableGenres}
        moodWeights={moodWeights}
        setMoodWeights={setMoodWeights}
        onSearch={handleSearch}
        // Fusion Props
        fusionTitleA={fusionTitleA}
        setFusionTitleA={setFusionTitleA}
        fusionTitleB={fusionTitleB}
        setFusionTitleB={setFusionTitleB}
        fusionRatio={fusionRatio}
        setFusionRatio={setFusionRatio}
        onFusionSearch={handleFusionSearch}
        // Metric Props
        metric={metric}
        onMetricChange={setMetric}
        // Pagination Props
        resultsPerPage={resultsPerPage}
        onResultsPerPageChange={setResultsPerPage}
      />

      {recommendations.length > 0 ? (
        <div className="movie-grid">
          {recommendations.map((movie, index) => (
            <MovieCard
              key={`${movie.id}-${index}`}
              movie={movie}
              allGenres={availableGenres}
              targetVector={targetVector}
              metric={metric}
            />
          ))}
        </div>
      ) : (
        !loading && (
          <div className="hero-section">
            <div className="icon">🍿</div>
            <h2>Siap mencari film?</h2>
            <p>Ketik judul film atau atur mood vektor di atas untuk memulai algoritma.</p>
          </div>
        )
      )}

      {loading && (
        <div className="modal-overlay">
          <div className="loading-overlay-content">
            <div className="spinner">⚙️</div>
            <h3>Mengkomputasi Matriks...</h3>
          </div>
        </div>
      )}

      <ErrorNotification message={error} onClose={() => setError('')} />
    </div>
  );
}

export default App;