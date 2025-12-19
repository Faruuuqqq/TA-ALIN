import { useEffect, useState } from 'react';
import axios from 'axios';
import { MovieCard } from './components/MovieCard';
import { ControlsPanel } from './components/ControlsPanel';
import { ErrorNotification } from './components/ErrorNotification';
import { useAppContext } from './context/AppContext';
import './App.css';

// Get API base URL from environment or use default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

function App() {
  // Gunakan context untuk state management
  const {
    mode,
    setMode,
    availableGenres,
    setAvailableGenres,
    queryTitle,
    setQueryTitle,
    moodWeights,
    setMoodWeights,
    fusionTitleA,
    setFusionTitleA,
    fusionTitleB,
    setFusionTitleB,
    fusionRatio,
    setFusionRatio,
    recommendations,
    setRecommendations,
    targetVector,
    setTargetVector,
    loading,
    setLoading,
    error,
    setError,
  } = useAppContext();

  // Local state untuk metric dan pagination
  const [metric, setMetric] = useState<'cosine' | 'euclidean' | 'manhattan'>('cosine');
  const [resultsPerPage, setResultsPerPage] = useState(12);

  // Load genres on mount
  useEffect(() => {
    axios.get(`${API_BASE_URL}/genres`)
      .then(res => setAvailableGenres(Array.from(new Set(res.data))))
      .catch(() => setError('Tidak dapat memuat daftar genre dari server.'));
  }, [setAvailableGenres, setError]);

  // Clear recommendations when mode changes
  useEffect(() => {
    setRecommendations([]);
  }, [mode, setRecommendations]);

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
        url = `${API_BASE_URL}/recommend?title=${encodeURIComponent(queryTitle.trim())}&metric=${metric}&limit=${resultsPerPage}`;
      } else { // mode === 'mood'
        if (Object.keys(moodWeights).length === 0) {
          setLoading(false);
          return;
        }
        const jsonWeights = JSON.stringify(moodWeights);
        url = `${API_BASE_URL}/recommend/mood?weights=${encodeURIComponent(jsonWeights)}&metric=${metric}&limit=${resultsPerPage}`;
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
      handleApiError(err);
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
        `${API_BASE_URL}/recommend/fusion`,
        {
          titleA: fusionTitleA.trim(),
          titleB: fusionTitleB.trim(),
          ratio: parseFloat(fusionRatio.toString()),
          metric,
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
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApiError = (err: any) => {
    if (err.response?.status === 400) {
      const errorMsg = err.response.data?.message || 'Permintaan tidak valid';
      setError(errorMsg);
    } else if (err.response?.status === 500) {
      setError('Terjadi kesalahan di server. Silakan coba lagi.');
    } else if (err.code === 'ERR_NETWORK') {
      setError(`Tidak dapat terhubung ke server di ${API_BASE_URL}`);
    } else {
      setError('Terjadi kesalahan saat mengambil data dari server.');
    }
    console.error('API error:', err);
  };

  return (
    <div className="container">
      <header className="header">
        <h1>CineMatch</h1>
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
            <h2>Siap mencari film?</h2>
            <p>Ketik judul film atau atur mood vektor di atas untuk memulai algoritma.</p>
          </div>
        )
      )}

      {loading && (
        <div className="modal-overlay">
          <div className="loading-overlay-content">
            <div className="spinner"></div>
            <h3>Mengkomputasi Matriks...</h3>
          </div>
        </div>
      )}

      <ErrorNotification message={error} onClose={() => setError('')} />
    </div>
  );
}

export default App;