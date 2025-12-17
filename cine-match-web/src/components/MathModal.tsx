import { useState } from 'react';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  movieTitle: string;
  movieVector: number[];
  targetVector: number[];
  score: string;
  availableGenres: string[];
  metric?: 'cosine' | 'euclidean' | 'manhattan';
}

export const MathModal = ({ 
  isOpen, 
  onClose, 
  movieTitle, 
  movieVector, 
  targetVector, 
  score, 
  availableGenres,
  metric = 'cosine'
}: Props) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'visual' | 'math'>('visual');

  // --- PERSIAPAN DATA ---
  const genreCount = availableGenres.length;
  const finalScore = (parseFloat(score) * 100).toFixed(0);
  
  // Mencari Genre yang "Match" (Sama-sama > 0 di kedua vektor)
  const matchingGenres = availableGenres.filter((_, i) => movieVector[i] > 0 && targetVector[i] > 0);
  
  // Data Rating (Dimensi Terakhir)
  const movieRating = movieVector[genreCount];
  const targetRating = targetVector[genreCount] || 0.8;

  // --- PERHITUNGAN BERDASARKAN METRIC ---
  
  // Dot Product (untuk Cosine)
  const dotProductCalc = movieVector.reduce((sum, val, i) => sum + val * (targetVector[i] || 0), 0);
  const magA = Math.sqrt(movieVector.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(targetVector.reduce((sum, val) => sum + val * val, 0));
  const cosineSimilarity = dotProductCalc / (magA * magB);

  // Euclidean Distance
  const euclideanDist = Math.sqrt(
    movieVector.reduce((sum, val, i) => sum + Math.pow(val - (targetVector[i] || 0), 2), 0)
  );
  const euclideanScore = 1 / (1 + euclideanDist);

  // Manhattan Distance
  const manhattanDist = movieVector.reduce((sum, val, i) => sum + Math.abs(val - (targetVector[i] || 0)), 0);
  const manhattanScore = 1 / (1 + manhattanDist);

  // --- DYNAMIC FORMULAS ---
  let mainFormula = '';
  let formulaExplanation = '';
  let calculation1 = '';
  let calculation2 = '';
  let finalCalculation = '';

  if (metric === 'cosine') {
    mainFormula = `\\cos(\\theta) = \\frac{\\mathbf{A} \\cdot \\mathbf{B}}{\\|\\mathbf{A}\\| \\cdot \\|\\mathbf{B}\\|}`;
    formulaExplanation = 'Cosine Similarity menghitung sudut antara dua vektor di ruang multidimensional';
    calculation1 = `\\mathbf{A} \\cdot \\mathbf{B} = ${dotProductCalc.toFixed(4)}`;
    calculation2 = `\\|\\mathbf{A}\\| = ${magA.toFixed(4)}, \\quad \\|\\mathbf{B}\\| = ${magB.toFixed(4)}`;
    finalCalculation = `\\text{Hasil} = \\frac{${dotProductCalc.toFixed(4)}}{${magA.toFixed(4)} \\times ${magB.toFixed(4)}} = ${cosineSimilarity.toFixed(4)}`;
  } else if (metric === 'euclidean') {
    mainFormula = `d(\\mathbf{A}, \\mathbf{B}) = \\sqrt{\\sum_{i=1}^{n} (A_i - B_i)^2}`;
    formulaExplanation = 'Euclidean Distance adalah jarak garis lurus antara dua titik di ruang multidimensional';
    calculation1 = `\\text{Jarak Euclidean} = ${euclideanDist.toFixed(4)}`;
    calculation2 = `\\text{Score (Normalized)} = \\frac{1}{1 + d} = \\frac{1}{1 + ${euclideanDist.toFixed(4)}}`;
    finalCalculation = `\\text{Hasil} = ${euclideanScore.toFixed(4)}`;
  } else if (metric === 'manhattan') {
    mainFormula = `d(\\mathbf{A}, \\mathbf{B}) = \\sum_{i=1}^{n} |A_i - B_i|`;
    formulaExplanation = 'Manhattan Distance adalah jumlah jarak absolute antara koordinat (seperti grid kota)';
    calculation1 = `\\text{Jarak Manhattan} = ${manhattanDist.toFixed(4)}`;
    calculation2 = `\\text{Score (Normalized)} = \\frac{1}{1 + d} = \\frac{1}{1 + ${manhattanDist.toFixed(4)}}`;
    finalCalculation = `\\text{Hasil} = ${manhattanScore.toFixed(4)}`;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: '800px', maxHeight: '85vh'}}>
        
        {/* HEADER MODAL */}
        <div className="modal-header">
          <div>
            <h2 style={{margin: 0, fontSize: '1.5rem', color: '#f8fafc'}}>📊 Analisis: {movieTitle}</h2>
            <p style={{margin: '5px 0 0', color: '#94a3b8', fontSize: '0.9rem'}}>
              Metode: <strong style={{color: '#6366f1'}}>{metric.charAt(0).toUpperCase() + metric.slice(1)}</strong> | 
              Tingkat Kecocokan: <strong style={{color: '#14b8a6'}}>{finalScore}%</strong>
            </p>
          </div>
          <button 
            className="btn-close" 
            onClick={onClose} 
            style={{
              background:'transparent', 
              border:'none', 
              color:'#94a3b8', 
              fontSize:'2rem', 
              cursor:'pointer',
              padding: '0',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        {/* NAVIGASI TAB */}
        <div style={{display: 'flex', borderBottom: '1px solid #334155', marginBottom: '20px'}}>
          <button 
            onClick={() => setActiveTab('visual')}
            style={{
              flex: 1, padding: '15px', background: 'transparent', border: 'none', 
              color: activeTab === 'visual' ? '#6366f1' : '#64748b',
              borderBottom: activeTab === 'visual' ? '2px solid #6366f1' : 'none',
              fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            💡 Penjelasan Visual
          </button>
          <button 
            onClick={() => setActiveTab('math')}
            style={{
              flex: 1, padding: '15px', background: 'transparent', border: 'none', 
              color: activeTab === 'math' ? '#6366f1' : '#64748b',
              borderBottom: activeTab === 'math' ? '2px solid #6366f1' : 'none',
              fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            🧮 Pembuktian Rumus
          </button>
        </div>
        
        <div className="math-body" style={{maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px'}}>
          
          {/* TAB 1: VISUAL (User Friendly) */}
          {activeTab === 'visual' && (
            <div className="visual-tab">
              <div style={{background: 'rgba(99, 102, 241, 0.1)', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(99, 102, 241, 0.3)'}}>
                <h3 style={{marginTop: 0, color: '#818cf8', fontSize: '1.1rem'}}>💡 Mengapa film ini muncul?</h3>
                <p style={{lineHeight: '1.6', color: '#cbd5e1', margin: 0}}>
                  {metric === 'cosine' && `Sistem mendeteksi pola vektor film ini memiliki sudut yang sangat kecil (≈ ${(Math.acos(parseFloat(score)) * (180 / Math.PI)).toFixed(1)}°) dengan preferensi pencarian Anda.`}
                  {metric === 'euclidean' && `Sistem mendeteksi bahwa jarak Euclidean antara vektor film dan preferensi Anda sangat kecil (${euclideanDist.toFixed(3)}), menunjukkan kesamaan tinggi.`}
                  {metric === 'manhattan' && `Sistem mendeteksi bahwa jarak Manhattan antara vektor film dan preferensi Anda sangat kecil (${manhattanDist.toFixed(3)}), menunjukkan kesamaan tinggi dalam nilai absolut.`}
                </p>
              </div>

              <h4 style={{marginBottom: '15px', color: '#e2e8f0'}}>✨ Faktor Penentu Utama:</h4>
              {matchingGenres.length > 0 ? (
                <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px'}}>
                  {matchingGenres.map(g => (
                    <span key={g} style={{background: '#14b8a6', color: '#0f172a', padding: '6px 14px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.9rem', boxShadow: '0 2px 10px rgba(20, 184, 166, 0.2)'}}>
                      ✅ {g}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{fontStyle: 'italic', color: '#94a3b8', marginBottom: '20px'}}>
                  Tidak ada genre spesifik yang beririsan langsung, namun kemiripan didorong oleh faktor Rating dan atribut vektor lainnya.
                </p>
              )}

              <div style={{marginTop: '20px', padding: '20px', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem'}}>
                  <span style={{color: '#94a3b8'}}>Kontribusi Kualitas (Rating)</span>
                  <strong style={{color: '#f43f5e'}}>{movieRating?.toFixed(1) || 'N/A'} / 1.0</strong>
                </div>
                <div style={{width: '100%', background: '#334155', height: '8px', borderRadius: '4px', overflow: 'hidden'}}>
                  <div style={{width: `${(movieRating || 0) * 100}%`, background: 'linear-gradient(90deg, #f43f5e, #fb7185)', height: '100%', borderRadius: '4px'}}></div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MATH (Detail Perhitungan) */}
          {activeTab === 'math' && (
            <div className="math-tab">
              
              {/* Main Formula */}
              <div style={{marginBottom: '20px'}}>
                <h3 style={{fontSize: '0.95rem', color: '#a5b4fc', marginBottom: '10px'}}>📐 Rumus {metric === 'cosine' ? 'Cosine Similarity' : metric === 'euclidean' ? 'Euclidean Distance' : 'Manhattan Distance'}:</h3>
                <div className="formula-box" style={{background: '#0f172a', padding: '20px', borderRadius: '8px', border: '1px solid #334155', marginBottom: '15px', overflow: 'auto'}}>
                  <BlockMath math={mainFormula} />
                </div>
                <p style={{color: '#cbd5e1', fontSize: '0.9rem', margin: '10px 0'}}>{formulaExplanation}</p>
              </div>

              {/* Vector Table */}
              <h3 style={{fontSize: '1rem', color: '#a5b4fc', borderBottom: '1px solid #334155', paddingBottom: '10px', marginTop: '25px', marginBottom: '15px'}}>📋 Bedah Komponen Vektor (Non-Zero):</h3>
              <div style={{overflowX: 'auto'}}>
                <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: '500px'}}>
                  <thead>
                     <tr style={{textAlign: 'left', color: '#64748b', background: '#1e293b'}}>
                       <th style={{padding: '10px', borderBottom: '2px solid #334155'}}>Dimensi (Genre)</th>
                       <th style={{padding: '10px', borderBottom: '2px solid #334155'}}>A (Film)</th>
                       <th style={{padding: '10px', borderBottom: '2px solid #334155'}}>B (Query)</th>
                       <th style={{padding: '10px', borderBottom: '2px solid #334155'}}>
                         {metric === 'cosine' ? 'Dot Product' : metric === 'euclidean' ? '(A-B)²' : '|A-B|'}
                       </th>
                     </tr>
                  </thead>
                  <tbody>
                    {availableGenres.map((genre, i) => {
                      const valA = movieVector[i] || 0;
                      const valB = targetVector[i] || 0;
                      
                      // Hanya tampilkan jika salah satu bernilai > 0
                      if (valA === 0 && valB === 0) return null;
                      
                      const isMatch = valA > 0 && valB > 0;
                      
                      let cellValue = 0;
                      if (metric === 'cosine') {
                        cellValue = valA * valB;
                      } else if (metric === 'euclidean') {
                        cellValue = Math.pow(valA - valB, 2);
                      } else {
                        cellValue = Math.abs(valA - valB);
                      }
                      
                      return (
                        <tr key={genre} style={{
                          background: isMatch ? 'rgba(20, 184, 166, 0.05)' : 'transparent', 
                          borderBottom: '1px solid #1e293b'
                        }}>
                          <td style={{padding: '10px', color: isMatch ? '#14b8a6' : '#cbd5e1', fontWeight: isMatch ? 'bold' : 'normal'}}>{genre}</td>
                          <td style={{padding: '10px', color: '#cbd5e1'}}>{valA.toFixed(2)}</td>
                          <td style={{padding: '10px', color: '#cbd5e1'}}>{valB.toFixed(2)}</td>
                          <td style={{padding: '10px', fontWeight: 'bold', color: isMatch ? '#14b8a6' : '#64748b'}}>
                            {cellValue.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                    
                    {/* Baris Rating */}
                    <tr style={{background: 'rgba(244, 63, 94, 0.05)', borderTop: '2px solid #334155', fontWeight: 'bold'}}>
                      <td style={{padding: '10px', color: '#f43f5e'}}>⭐ RATING</td>
                      <td style={{padding: '10px', color: '#f43f5e'}}>{movieRating?.toFixed(2) || '0.00'}</td>
                      <td style={{padding: '10px', color: '#f43f5e'}}>{targetRating.toFixed(2)}</td>
                      <td style={{padding: '10px', color: '#f43f5e'}}>
                        {metric === 'cosine' 
                          ? (movieRating * targetRating).toFixed(2)
                          : metric === 'euclidean'
                          ? Math.pow((movieRating || 0) - targetRating, 2).toFixed(2)
                          : Math.abs((movieRating || 0) - targetRating).toFixed(2)
                        }
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Calculations */}
              <div style={{marginTop: '25px', padding: '20px', background: '#0f172a', borderRadius: '8px', border: '1px solid #334155'}}>
                <h3 style={{marginTop: 0, color: '#a5b4fc', fontSize: '0.95rem', marginBottom: '15px'}}>🔢 Tahap Perhitungan:</h3>
                
                <div style={{marginBottom: '15px', padding: '10px', background: '#1e293b', borderRadius: '6px'}}>
                  <p style={{margin: '0 0 5px', color: '#94a3b8', fontSize: '0.85rem'}}>Langkah 1:</p>
                  <BlockMath math={calculation1} />
                </div>

                <div style={{marginBottom: '15px', padding: '10px', background: '#1e293b', borderRadius: '6px'}}>
                  <p style={{margin: '0 0 5px', color: '#94a3b8', fontSize: '0.85rem'}}>Langkah 2:</p>
                  <BlockMath math={calculation2} />
                </div>

                <div style={{marginBottom: '0', padding: '15px', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '6px', border: '2px solid #6366f1'}}>
                  <p style={{margin: '0 0 10px', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 'bold'}}>Hasil Akhir:</p>
                  <BlockMath math={finalCalculation} />
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};
