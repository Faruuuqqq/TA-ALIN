// src/components/ControlsPanel.tsx
import { useState } from 'react';

interface ControlsProps {
  mode: 'title' | 'mood' | 'fusion';
  setMode: (mode: 'title' | 'mood' | 'fusion') => void;
  queryTitle: string;
  setQueryTitle: (val: string) => void;
  availableGenres: string[];
  moodWeights: Record<string, number>;
  setMoodWeights: (weights: Record<string, number>) => void;
  onSearch: () => void;
  // Fusion Props
  fusionTitleA: string;
  setFusionTitleA: (val: string) => void;
  fusionTitleB: string;
  setFusionTitleB: (val: string) => void;
  fusionRatio: number;
  setFusionRatio: (val: number) => void;
  onFusionSearch: () => void;
}

export const ControlsPanel = ({
  mode, setMode,
  queryTitle, setQueryTitle,
  availableGenres,
  moodWeights, setMoodWeights,
  onSearch,
  // Fusion Props
  fusionTitleA, setFusionTitleA,
  fusionTitleB, setFusionTitleB,
  fusionRatio, setFusionRatio,
  onFusionSearch,
}: ControlsProps) => {

  // Fungsi helper untuk toggle genre & slider (sama seperti sebelumnya)
  const toggleGenre = (genre: string) => {
    const newWeights = { ...moodWeights };
    if (newWeights[genre]) delete newWeights[genre];
    else newWeights[genre] = 5;
    setMoodWeights(newWeights);
  };

  const updateWeight = (genre: string, val: string) => {
    setMoodWeights({ ...moodWeights, [genre]: parseInt(val) });
  };

  return (
    <div className="controls-wrapper">
      {/* 1. TABS */}
      <div className="tabs">
        <button
          className={mode === 'title' ? 'active' : ''}
          onClick={() => setMode('title')}
        >
          🔍 Cari Judul
        </button>
        <button
          className={mode === 'mood' ? 'active' : ''}
          onClick={() => setMode('mood')}
        >
          🎭 Vektor Mood
        </button>
        <button
          className={mode === 'fusion' ? 'active' : ''}
          onClick={() => setMode('fusion')}
        >
          🧬 Movie Fusion
        </button>
      </div>

      {/* 2. SEARCH AREA (Untuk Title Mode) */}
      {mode === 'title' && (
        <div className="search-box-area">
          <div className="input-group">
            <input
              type="text"
              className="search-input"
              placeholder="Masukkan judul film (e.g. Inception)..."
              value={queryTitle}
              onChange={(e) => setQueryTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            />
            <button className="btn-primary" onClick={onSearch}>
              Cari Film
            </button>
          </div>
        </div>
      )}

      {/* 3. MOOD AREA (Untuk Mood Mode) */}
      {mode === 'mood' && (
        <div className="mood-area">
          <p style={{textAlign:'center', marginBottom:'15px', color:'#94a3b8'}}>
            Pilih genre untuk membangun vektor seleramu:
          </p>

          <div className="genre-tags">
            {availableGenres.map(g => (
              <span
                key={g}
                className={`tag ${moodWeights[g] ? 'selected' : ''}`}
                onClick={() => toggleGenre(g)}
              >
                {g}
              </span>
            ))}
          </div>

          {Object.keys(moodWeights).length > 0 && (
            <div className="sliders-grid">
              {Object.entries(moodWeights).map(([genre, weight]) => (
                <div key={genre} className="slider-item">
                  <label>
                    <span>{genre}</span>
                    <strong style={{color:'var(--accent)'}}>{weight}</strong>
                  </label>
                  <input
                    type="range"
                    min="1" max="10"
                    value={weight}
                    onChange={(e) => updateWeight(genre, e.target.value)}
                    style={{width: '100%', accentColor: 'var(--accent)'}}
                  />
                </div>
              ))}
            </div>
          )}

          <div style={{textAlign: 'center', marginTop: '30px'}}>
             <button className="btn-primary" onClick={onSearch} style={{width: '100%', maxWidth: '300px'}}>
               Hitung & Rekomendasikan
             </button>
          </div>
        </div>
      )}

      {/* 4. FUSION AREA (Untuk Fusion Mode) */}
      {mode === 'fusion' && (
        <div className="search-box-area">
          <div className="input-group">
            <input
              type="text"
              className="search-input"
              placeholder="Judul Film A..."
              value={fusionTitleA}
              onChange={(e) => setFusionTitleA(e.target.value)}
            />
            <span style={{color: "var(--text-muted)", fontSize: "1.5rem"}}>+</span>
            <input
              type="text"
              className="search-input"
              placeholder="Judul Film B..."
              value={fusionTitleB}
              onChange={(e) => setFusionTitleB(e.target.value)}
            />
          </div>
          <div className="slider-item" style={{width: '100%', maxWidth: '600px', marginTop: '15px'}}>
            <label>
              <span>Dominasi</span>
              <strong style={{color:'var(--primary)'}}>{Math.round(fusionRatio * 100)}% A / {Math.round((1 - fusionRatio) * 100)}% B</strong>
            </label>
            <input
              type="range"
              min="0" max="1" step="0.05"
              value={fusionRatio}
              onChange={(e) => setFusionRatio(parseFloat(e.target.value))}
              style={{width: '100%', accentColor: 'var(--primary)'}}
            />
          </div>
          <div style={{textAlign: 'center', marginTop: '20px'}}>
            <button className="btn-primary" onClick={onFusionSearch} disabled={!fusionTitleA || !fusionTitleB}>
              Fuse & Cari Rekomendasi
            </button>
          </div>
        </div>
      )}
    </div>
  );
};