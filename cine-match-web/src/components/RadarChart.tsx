import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';

interface Props {
  allGenres: string[];
  movieGenres: string[];
  targetGenres: string[];
}

export const GenreRadarChart = ({ allGenres, movieGenres, targetGenres }: Props) => {
  // Filter genre agar yang ditampilkan relevan saja
  // Kita tambahkan slice(0, allGenres.length) untuk jaga-jaga
  const relevantGenres = allGenres.filter(g => movieGenres.includes(g) || targetGenres.includes(g));
  
  // Jika genre terlalu sedikit, tambah dummy dari list awal
  const displayGenres = relevantGenres.length < 4 ? allGenres.slice(0, 6) : relevantGenres;

  const data = displayGenres.map(g => ({
    subject: g,
    Film: movieGenres.includes(g) ? 100 : 0,    
    Target: targetGenres.includes(g) ? 100 : 0,
  }));

  return (
    <div style={{ width: '100%', height: 200, fontSize: '10px' }}>
      <ResponsiveContainer>
        <RadarChart cx="50%" cy="50%" outerRadius="65%" data={data}>
          <PolarGrid stroke="#444" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#ccc' }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
          <Radar name="Film Ini" dataKey="Film" stroke="#8884d8" fill="#8884d8" fillOpacity={0.5} />
          
          {/* Tampilkan Target hanya jika user sedang mode 'Mood' (ada target genres) */}
          {targetGenres.length > 0 && (
             <Radar name="Target User" dataKey="Target" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
          )}
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};