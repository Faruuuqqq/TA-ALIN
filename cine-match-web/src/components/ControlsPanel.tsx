import React, { useState } from 'react';

type Mode = 'title' | 'mood' | 'fusion';

interface ControlsPanelProps {
  mode: Mode;
  setMode: (mode: Mode) => void;
  availableGenres: string[];
  moodWeights: Record<string, number>;
  setMoodWeights: (weights: Record<string, number>) => void;
  queryTitle: string;
  setQueryTitle: (title: string) => void;
  onSearch: () => void;
  fusionTitleA: string;
  setFusionTitleA: (val: string) => void;
  fusionTitleB: string;
  setFusionTitleB: (val: string) => void;
  fusionRatio: number;
  setFusionRatio: (val: number) => void;
  onFusionSearch: () => void;
  metric?: 'cosine' | 'euclidean' | 'manhattan';
  onMetricChange?: (metric: 'cosine' | 'euclidean' | 'manhattan') => void;
  resultsPerPage?: number;
  onResultsPerPageChange?: (limit: number) => void;
}

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
  mode, setMode, availableGenres, moodWeights, setMoodWeights,
  queryTitle, setQueryTitle, onSearch,
  fusionTitleA, setFusionTitleA, fusionTitleB, setFusionTitleB,
  fusionRatio, setFusionRatio, onFusionSearch,
  metric = 'cosine',
  onMetricChange,
  resultsPerPage = 9,
  onResultsPerPageChange,
}) => {
  const [isVectorExpanded, setIsVectorExpanded] = useState(false);
  const activeGenres = availableGenres.filter(g => moodWeights[g] > 0);

  // Helper functions untuk mood management
  const toggleGenre = (genre: string) => {
    setMoodWeights({
      ...moodWeights,
      [genre]: moodWeights[genre] ? 0 : 5,
    });
  };

  const updateWeight = (genre: string, value: string) => {
    setMoodWeights({
      ...moodWeights,
      [genre]: Math.max(0, parseInt(value, 10)),
    });
  };
  
  return (
    <div className="controls-wrapper">
       <div className="tabs">
         <button className={mode === 'title' ? 'active' : ''} onClick={() => setMode('title')}>Cari Judul</button>
         <button className={mode === 'mood' ? 'active' : ''} onClick={() => setMode('mood')}>Vektor Mood</button>
         <button className={mode === 'fusion' ? 'active' : ''} onClick={() => setMode('fusion')}>Movie Fusion</button>
       </div>

      {/* MODE TITLE */}
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

      {/* MODE MOOD */}
      {mode === 'mood' && (
        <div className="mood-area">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
            <p style={{margin: 0, color: '#94a3b8'}}>Bangun vektor preferensi Anda:</p>
            {Object.keys(moodWeights).length > 0 && (
              <span style={{fontSize: '0.8rem', color: '#f43f5e'}}>*Klik genre lagi untuk hapus</span>
            )}
          </div>

          <div className="genre-tags">
            {availableGenres.map((g) => (
              <span
                key={g}
                className={moodWeights[g] ? 'tag selected' : 'tag'}
                onClick={() => toggleGenre(g)}
              >
                {g}
              </span>
            ))}
          </div>

          {Object.keys(moodWeights).length > 0 && (
            <>
              <div className="sliders-grid">
                {Object.entries(moodWeights).map(([g, w]) => (
                  <div key={g}>
                    <div className="slider-container" style={{display:'flex', justifyContent:'space-between', fontSize:'0.9rem', marginBottom:'5px', color:'#ccc'}}>
                      <span>{g}</span> <strong style={{color:'var(--accent)'}}>{w}</strong>
                    </div>
                    <input
                      type="range" min="1" max="10" value={w}
                      style={{width:'100%', accentColor:'var(--accent)'}}
                      onChange={(e) => updateWeight(g, e.target.value)}
                    />
                  </div>
                ))}
              </div>

              {/* LIVE VECTOR MONITOR */}
               <div style={{background: '#0f172a', padding: '15px', borderRadius: '10px', border: '1px solid #334155', marginTop: '20px', fontFamily: 'JetBrains Mono, monospace'}}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}>
                    <span style={{color:'#94a3b8', fontSize:'0.8rem'}}>Vektor Query (Q)</span>
                    <button onClick={() => setIsVectorExpanded(!isVectorExpanded)} style={{background:'none', border:'none', color:'#6366f1', cursor:'pointer', fontSize:'0.8rem'}}>
                      {isVectorExpanded ? 'Sembunyikan' : 'Lihat Detail'}
                    </button>
                  </div>
                <div style={{display:'flex', gap:'8px', overflowX:'auto', paddingBottom:'5px'}}>
                   {(isVectorExpanded ? availableGenres : activeGenres).map(g => {
                     const val = moodWeights[g] || 0;
                     if (!isVectorExpanded && val === 0) return null;
                     return (
                       <div key={g} style={{padding:'5px 10px', background: val > 0 ? 'rgba(20, 184, 166, 0.1)' : '#1e293b', border: `1px solid ${val > 0 ? '#14b8a6' : '#334155'}`, borderRadius:'6px', textAlign:'center', minWidth:'60px'}}>
                         <div style={{fontSize:'0.7rem', color:'#94a3b8'}}>{g.substring(0,6)}</div>
                         <div style={{fontWeight:'bold', color: val > 0 ? '#14b8a6' : '#64748b'}}>{val}</div>
                       </div>
                     )
                   })}
                </div>
              </div>
            </>
          )}

           <div style={{textAlign: 'center', marginTop: '30px'}}>
            <button className="btn-primary" onClick={onSearch} disabled={Object.keys(moodWeights).length === 0} style={{width:'100%', maxWidth:'300px'}}>
              Hitung Rekomendasi
            </button>
          </div>
        </div>
      )}

      {/* MODE FUSION */}
      {mode === 'fusion' && (
        <div className="fusion-area">
          <p style={{textAlign:'center', marginBottom:'20px', color:'#94a3b8'}}>Gabungkan dua film untuk mencari "anak" dari kombinasi keduanya:</p>
          <div className="fusion-inputs" style={{display:'flex', gap:'10px', alignItems:'center', justifyContent:'center', marginBottom:'30px'}}>
            <input type="text" className="search-input" placeholder="Film A (e.g. Barbie)" value={fusionTitleA} onChange={(e) => setFusionTitleA(e.target.value)} style={{flex:1}} />
            <span style={{fontSize:'1.5rem', color:'var(--accent)', fontWeight:'bold'}}>+</span>
            <input type="text" className="search-input" placeholder="Film B (e.g. Oppenheimer)" value={fusionTitleB} onChange={(e) => setFusionTitleB(e.target.value)} style={{flex:1}} />
          </div>
          <div className="fusion-slider-container" style={{background:'rgba(0,0,0,0.2)', padding:'20px', borderRadius:'16px', marginBottom:'30px'}}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px', fontSize:'0.9rem'}}>
              <span style={{color: fusionRatio > 0.5 ? '#64748b' : 'var(--primary)'}}>Dominan Film A</span>
              <span style={{color:'white', fontWeight:'bold'}}>{Math.round((1 - fusionRatio) * 100)}% A - {Math.round(fusionRatio * 100)}% B</span>
              <span style={{color: fusionRatio < 0.5 ? '#64748b' : 'var(--accent)'}}>Dominan Film B</span>
            </div>
            <input type="range" min="0" max="1" step="0.1" value={fusionRatio} onChange={(e) => setFusionRatio(parseFloat(e.target.value))} style={{width:'100%', accentColor:'white', cursor:'pointer'}} />
          </div>
           <div style={{textAlign: 'center'}}>
             <button className="btn-primary" onClick={onFusionSearch} disabled={!fusionTitleA || !fusionTitleB} style={{background: 'linear-gradient(90deg, var(--primary), var(--accent))', border:'none'}}>
               Lakukan Fusi Vektor
             </button>
          </div>
        </div>
       )}

       {/* PAGINATION & METRIC CONTROLS */}
       <div className="controls-selector-group">
          {/* PAGINATION SELECTOR */}
          <div className="selector-item pagination-section">
            <span className="selector-label">Hasil per Halaman</span>
            <div className="custom-select">
              <select 
                value={resultsPerPage} 
                onChange={(e) => onResultsPerPageChange?.(parseInt(e.target.value, 10))}
              >
                <option value="4">4 Hasil</option>
                <option value="8">8 Hasil</option>
                <option value="12">12 Hasil</option>
                <option value="16">16 Hasil</option>
                <option value="20">20 Hasil</option>
                <option value="24">24 Hasil</option>
                <option value="28">28 Hasil</option>
                <option value="32">32 Hasil</option>
              </select>
            </div>
          </div>

          {/* METRIC SELECTOR - only for non-fusion modes */}
          {mode !== 'fusion' && (
            <div className="selector-item metric-section">
              <span className="selector-label">Metode Jarak</span>
              <div className="custom-select">
                <select 
                  value={metric} 
                  onChange={(e) => onMetricChange?.(e.target.value as any)}
                >
                  <option value="cosine">Cosine (Sudut)</option>
                  <option value="euclidean">Euclidean (Garis)</option>
                  <option value="manhattan">Manhattan (Grid)</option>
                </select>
              </div>
            </div>
          )}
       </div>
    </div>
  );
};