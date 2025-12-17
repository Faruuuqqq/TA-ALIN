import "katex/dist/katex.min.css";
import { BlockMath, InlineMath } from "react-katex";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  movieTitle: string;
  movieVector: number[];
  targetVector: number[];
  score: string;
  availableGenres: string[]; // NEW PROP
}

export const MathModal = ({
  isOpen,
  onClose,
  movieTitle,
  movieVector,
  targetVector,
  score,
  availableGenres,
}: Props) => {
  if (!isOpen) return null;

  // Rumus Cosine Similarity dalam format LaTeX
  // const formula = `\\text{cos}(\\theta) = \\frac{\\sum_{i=1}^{n} A_i B_i}{\\sqrt{\\sum_{i=1}^{n} A_i^2} \\sqrt{\\sum_{i=1}^{n} B_i^2}} = \\frac{A \\cdot B}{\\|A\\| \\|B\\|}`;

  const dotProduct = movieVector.reduce(
    (sum, val, i) => sum + val * (targetVector[i] || 0),
    0,
  ); // Calculate actual dot product
  const magMovie = Math.sqrt(
    movieVector.reduce((sum, val) => sum + val * val, 0),
  );
  const magTarget = Math.sqrt(
    targetVector.reduce((sum, val) => sum + val * val, 0),
  );
  const finalScore = (parseFloat(score) * 100).toFixed(0);
  const angleInDegrees = (
    Math.acos(parseFloat(score)) *
    (180 / Math.PI)
  ).toFixed(2);

  // For the table, we need to handle the last dimension which is the rating
  const genreCount = availableGenres.length;
  const dotProductGenres = movieVector
    .slice(0, genreCount)
    .reduce((sum, val, i) => sum + val * (targetVector[i] || 0), 0);
  const dotProductRating =
    movieVector[genreCount] * (targetVector[genreCount] || 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Perhitungan untuk: {movieTitle}</h2>
          <button className="btn-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="math-body">
          <h3>Cosine Similarity</h3>
          <p>
            Kecocokan dihitung dengan mengukur sudut antara vektor film dan
            vektor target (pencarian/mood Anda).
          </p>

          {/* <div className="formula-box">
            <BlockMath math={formula} />
          </div> */}

          <div className="calculation-steps">
            <h3>Bedah Dimensi (Non-Zero Only):</h3>
            <p style={{ fontSize: "0.8rem", color: "#aaa" }}>
              Hanya menampilkan dimensi di mana kedua vektor memiliki nilai
              (Match).
            </p>

            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.9rem",
                marginTop: "10px",
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid #333",
                    textAlign: "left",
                    color: "#6366f1",
                  }}
                >
                  <th style={{ padding: "8px" }}>Dimensi (Basis)</th>
                  <th style={{ padding: "8px" }}>Vektor Film ($\vec{A}$)</th>
                  <th style={{ padding: "8px" }}>Vektor Target ($\vec{B}$)</th>
                  <th style={{ padding: "8px" }}>
                    Perkalian ($a_i \cdot b_i$)
                  </th>
                </tr>
              </thead>
              <tbody>
                {availableGenres.map((genre, i) => {
                  const valA = movieVector[i];
                  const valB = targetVector[i];

                  // Hanya tampilkan jika salah satu bernilai > 0 (biar tabel gak kepanjangan)
                  if (valA === 0 && valB === 0) return null;

                  valA = A[i];

                  // Highlight jika MATCH (keduanya > 0)
                  const isMatch = valA > 0 && valB > 0;

                  return (
                    <tr
                      key={genre}
                      style={{
                        background: isMatch
                          ? "rgba(20, 184, 166, 0.1)"
                          : "transparent",
                        borderBottom: "1px solid #1e293b",
                      }}
                    >
                      <td style={{ padding: "8px", color: "#fff" }}>{genre}</td>
                      <td style={{ padding: "8px" }}>{valA}</td>
                      <td style={{ padding: "8px" }}>{valB || 0}</td>
                      <td
                        style={{
                          padding: "8px",
                          fontWeight: "bold",
                          color: isMatch ? "#14b8a6" : "#64748b",
                        }}
                      >
                        {(valA * (valB || 0)).toFixed(1)}
                      </td>
                    </tr>
                  );
                })}

                {/* Baris Rating (Dimensi Terakhir) */}
                <tr
                  key="rating"
                  style={{
                    background: "rgba(99, 102, 241, 0.1)",
                    borderTop: "2px solid #333",
                  }}
                >
                  <td style={{ padding: "8px", color: "#fff" }}>
                    RATING (Norm.)
                  </td>
                  <td style={{ padding: "8px" }}>
                    {movieVector[genreCount].toFixed(2)}
                  </td>
                  <td style={{ padding: "8px" }}>
                    {(targetVector[genreCount] || 0).toFixed(2)}
                  </td>
                  <td
                    style={{
                      padding: "8px",
                      fontWeight: "bold",
                      color: "#6366f1",
                    }}
                  >
                    {(
                      movieVector[genreCount] * (targetVector[genreCount] || 0)
                    ).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>

            <div
              style={{
                marginTop: "15px",
                textAlign: "right",
                color: "#14b8a6",
              }}
            >
              <strong>
                Total Dot Product ($\Sigma$): {dotProduct.toFixed(2)}
              </strong>
            </div>
          </div>

          <div className="final-result">
            <h4>Hasil Akhir:</h4>
            <p>
              Score = {score} ≈ <strong>{finalScore}%</strong> Match
            </p>
            {/* <p style={{marginTop: '10px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)'}}>
              (<InlineMath math={`\\text{Sudut } \\theta \\approx {${angleInDegrees}}^\\circ`}/>)
            </p> */}
          </div>
          <small className="math-note">
            Skor 1.0 berarti kedua vektor memiliki arah yang sama persis (sangat
            cocok).
          </small>
        </div>
      </div>
    </div>
  );
};
