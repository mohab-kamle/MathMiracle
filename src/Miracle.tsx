import { useState, useEffect, useMemo } from 'react';
import { Play, RotateCcw, Lock, CheckCircle2, XCircle, Info, BookOpen, Globe, Anchor, Scale } from 'lucide-react';

// --- CONSTANTS & DATA ---

// The "Target" sums found in the actual Quran for the 57/57 even/odd groups
const QURAN_ODD_GROUP_SUM = 6555;
const QURAN_EVEN_GROUP_SUM = 6236;

const LEVELS = [
  { id: 1, count: 10, name: "The Novice", description: "Try to balance 10 Surahs (5 Even / 5 Odd)." },
  { id: 2, count: 40, name: "The Scholar", description: "Try to balance 40 Surahs (20 Even / 20 Odd)." },
  { id: 3, count: 80, name: "The Hafiz", description: "Try to balance 80 Surahs (40 Even / 40 Odd)." },
  { id: 4, count: 114, name: "The Miracle", description: "The Ultimate Challenge: 114 Surahs with Perfect Sums." }
];

// --- COMPONENT ---

export default function QuranSymmetryGame() {
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [surahData, setSurahData] = useState<Array<{ id: number, ayahs: number, sum: number, isEven: boolean }>>([]);
  const [gameStatus, setGameStatus] = useState<'idle' | 'success' | 'fail' | 'perfect'>('idle');
  const [activeTab, setActiveTab] = useState<'game' | 'miracles'>('game');

  const currentLevel = LEVELS[currentLevelIdx];

  // Initialize empty data
  useEffect(() => {
    resetLevel();
  }, [currentLevelIdx]);

  const resetLevel = () => {
    setAttempts(0);
    setGameStatus('idle');
    setSurahData([]);
  };

  const generateRandom = () => {
    setAttempts(prev => prev + 1);
    
    // Generate random data for the current number of surahs
    // We simulate random ayah counts between 3 and 286 (typical Quran range)
    const newData = Array.from({ length: currentLevel.count }, (_, i) => {
      const surahNum = i + 1;
      const randomAyahs = Math.floor(Math.random() * 284) + 3; 
      const sum = surahNum + randomAyahs;
      return {
        id: surahNum,
        ayahs: randomAyahs,
        sum: sum,
        isEven: sum % 2 === 0
      };
    });

    setSurahData(newData);

    // Check Logic
    const evenCount = newData.filter(d => d.isEven).length;
    const oddCount = newData.length - evenCount;
    const target = currentLevel.count / 2;

    const isSplitCorrect = evenCount === target && oddCount === target;

    // Advanced Check for Level 4 (The Summation Miracle)
    if (currentLevel.id === 4) {
      if (isSplitCorrect) {
        // Calculate sums of the groups
        const evenGroupSum = newData.filter(d => d.isEven).reduce((acc, curr) => acc + curr.sum, 0);
        const oddGroupSum = newData.filter(d => !d.isEven).reduce((acc, curr) => acc + curr.sum, 0);

        // Check if they match the Quran's miracle sums
        const isPerfect = (oddGroupSum === QURAN_ODD_GROUP_SUM && evenGroupSum === QURAN_EVEN_GROUP_SUM);
        
        if (isPerfect) {
          setGameStatus('perfect'); // Virtually impossible
        } else {
          setGameStatus('success'); // Just the split was right, but sums were wrong
        }
      } else {
        setGameStatus('fail');
      }
    } else {
      // Normal Levels
      setGameStatus(isSplitCorrect ? 'success' : 'fail');
    }
  };

  // Stats for the current roll
  const evenCount = surahData.filter(d => d.isEven).length;
  const oddCount = surahData.length - evenCount;
  const targetHalf = currentLevel.count / 2;
  
  // Calculate probability of hitting exactly N/2 evens in N trials (Binomial PDF)
  // P(k) = (n choose k) * 0.5^n
  const calculateProbability = (n: number) => {
    // A simple approximation for visualization or exact for small N
    if (n > 50) return "Low (< 8%)";
    if (n > 20) return "Medium (~12%)";
    return "High (~25%)";
  };

  const sums = useMemo(() => {
    if (surahData.length === 0) return { even: 0, odd: 0 };
    return {
      even: surahData.filter(d => d.isEven).reduce((acc, curr) => acc + curr.sum, 0),
      odd: surahData.filter(d => !d.isEven).reduce((acc, curr) => acc + curr.sum, 0)
    };
  }, [surahData]);


  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Header */}
      <header className="bg-emerald-700 text-white p-6 shadow-lg">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Scale className="w-8 h-8" />
              The Symmetry of Design
            </h1>
            <p className="text-emerald-100 mt-2 opacity-90">A Mathematical Proof Project</p>
          </div>
          <div className="flex gap-4 mt-4 md:mt-0">
            <button 
              onClick={() => setActiveTab('game')}
              className={`px-4 py-2 rounded-full font-semibold transition ${activeTab === 'game' ? 'bg-white text-emerald-800' : 'bg-emerald-800 text-white hover:bg-emerald-600'}`}
            >
              The Simulation
            </button>
            <button 
              onClick={() => setActiveTab('miracles')}
              className={`px-4 py-2 rounded-full font-semibold transition ${activeTab === 'miracles' ? 'bg-white text-emerald-800' : 'bg-emerald-800 text-white hover:bg-emerald-600'}`}
            >
              More Miracles
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-6">
        
        {activeTab === 'game' ? (
          <div className="space-y-8">
            {/* Level Selector */}
            <div className="flex flex-wrap gap-4 justify-center">
              {LEVELS.map((lvl, idx) => (
                <button
                  key={lvl.id}
                  onClick={() => setCurrentLevelIdx(idx)}
                  disabled={idx > currentLevelIdx && idx > 0 && false} // removed lock for demo purposes
                  className={`relative flex flex-col items-center p-4 rounded-xl border-2 w-40 transition-all
                    ${currentLevelIdx === idx 
                      ? 'border-emerald-600 bg-emerald-50 scale-105 shadow-md' 
                      : 'border-slate-200 bg-white hover:border-emerald-300 text-slate-400 hover:text-slate-600'}`}
                >
                  <span className="text-sm uppercase font-bold tracking-wider mb-1">Level {lvl.id}</span>
                  <span className="text-2xl font-black">{lvl.count}</span>
                  <span className="text-xs">Surahs</span>
                  {idx > currentLevelIdx + 1 && <Lock className="absolute top-2 right-2 w-4 h-4 opacity-50" />}
                </button>
              ))}
            </div>

            {/* Game Board */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
              <div className="p-8 text-center bg-slate-900 text-white">
                <h2 className="text-2xl font-bold mb-2">{currentLevel.name}</h2>
                <p className="text-slate-300 max-w-2xl mx-auto">{currentLevel.description}</p>
                
                <div className="mt-8 flex justify-center items-center gap-8">
                   <div className="text-center">
                      <div className="text-xs uppercase tracking-widest text-slate-400 mb-1">Target Even</div>
                      <div className={`text-4xl font-mono font-bold ${evenCount === targetHalf ? 'text-green-400' : 'text-white'}`}>
                        {evenCount} <span className="text-lg text-slate-500">/ {targetHalf}</span>
                      </div>
                   </div>
                   
                   <div className="h-12 w-px bg-slate-700"></div>

                   <div className="text-center">
                      <div className="text-xs uppercase tracking-widest text-slate-400 mb-1">Target Odd</div>
                      <div className={`text-4xl font-mono font-bold ${oddCount === targetHalf ? 'text-green-400' : 'text-white'}`}>
                        {oddCount} <span className="text-lg text-slate-500">/ {targetHalf}</span>
                      </div>
                   </div>
                </div>

                {/* Level 4 Special Sums Display */}
                {currentLevel.id === 4 && surahData.length > 0 && (
                  <div className="mt-8 bg-slate-800 p-4 rounded-lg inline-block border border-slate-700">
                    <h3 className="text-emerald-400 text-sm font-bold uppercase tracking-wider mb-3">Divine Design Verification</h3>
                    <div className="grid grid-cols-2 gap-8 text-left">
                      <div>
                        <div className="text-xs text-slate-400">Sum of Odd Group</div>
                        <div className="font-mono text-xl flex items-center gap-2">
                          {sums.odd} 
                          {sums.odd === QURAN_ODD_GROUP_SUM 
                            ? <CheckCircle2 className="text-green-500 w-5 h-5"/> 
                            : <span className="text-red-500 text-xs">(Target: {QURAN_ODD_GROUP_SUM})</span>}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">Sum of Even Group</div>
                        <div className="font-mono text-xl flex items-center gap-2">
                          {sums.even}
                          {sums.even === QURAN_EVEN_GROUP_SUM 
                            ? <CheckCircle2 className="text-green-500 w-5 h-5"/> 
                            : <span className="text-red-500 text-xs">(Target: {QURAN_EVEN_GROUP_SUM})</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-8">
                  <button 
                    onClick={generateRandom}
                    className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-emerald-600 font-lg rounded-full hover:bg-emerald-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600"
                  >
                    <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                    Generate Random Book
                  </button>
                  <p className="mt-4 text-xs text-slate-500">Attempt #{attempts} • Probability of Parity: {calculateProbability(currentLevel.count)}</p>
                </div>
              </div>

              {/* Status Message */}
              {gameStatus !== 'idle' && (
                <div className={`p-4 text-center border-b ${
                  gameStatus === 'fail' ? 'bg-amber-50 text-amber-800 border-amber-100' : 
                  gameStatus === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' :
                  'bg-purple-100 text-purple-900 border-purple-200'
                }`}>
                  <div className="flex items-center justify-center gap-2 font-bold">
                    {gameStatus === 'fail' && <XCircle className="w-6 h-6" />}
                    {gameStatus === 'success' && <CheckCircle2 className="w-6 h-6" />}
                    {gameStatus === 'perfect' && <CheckCircle2 className="w-6 h-6" />}
                    
                    <span>
                      {gameStatus === 'fail' && "Imbalance Detected. Try again."}
                      {gameStatus === 'success' && currentLevel.id !== 4 && "Symmetry Achieved! You beat the odds."}
                      {gameStatus === 'success' && currentLevel.id === 4 && "Partial Symmetry! You got the 57/57 split (Level 1), but the Sums do not match the Quran (Level 2)."}
                      {gameStatus === 'perfect' && "SUBHANALLAH! Impossible Match Found!"}
                    </span>
                  </div>
                  {currentLevel.id === 4 && gameStatus === 'success' && (
                    <p className="text-sm mt-1 opacity-80">Getting the exact sums by luck is statistically virtually impossible.</p>
                  )}
                </div>
              )}

              {/* Visualization Grid */}
              <div className="p-6 bg-slate-50 min-h-[300px] max-h-[500px] overflow-y-auto">
                 {surahData.length === 0 ? (
                   <div className="h-full flex flex-col items-center justify-center text-slate-400 mt-20">
                     <RotateCcw className="w-12 h-12 mb-4 opacity-20" />
                     <p>Press Generate to create a random set of Surahs</p>
                   </div>
                 ) : (
                   <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
                      {surahData.map((data) => (
                        <div key={data.id} className={`p-2 rounded border text-xs flex flex-col items-center transition-all ${
                          data.isEven ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'
                        }`}>
                          <div className="font-bold opacity-50">Surah {data.id}</div>
                          <div className="text-[10px] text-slate-500">{data.ayahs} Ayahs</div>
                          <div className={`font-mono font-bold mt-1 ${data.isEven ? 'text-blue-600' : 'text-orange-600'}`}>
                            Sum: {data.sum}
                          </div>
                        </div>
                      ))}
                   </div>
                 )}
              </div>
            </div>
            
            {/* Explanation Block */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-emerald-600" />
                How this proves design
              </h3>
              <ul className="space-y-3 text-slate-600 text-sm">
                <li className="flex gap-3">
                  <div className="bg-slate-100 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0">1</div>
                  <p>In the Quran, there are 114 Surahs. The "Sum" is calculated by adding the Surah Number + Number of Ayahs.</p>
                </li>
                <li className="flex gap-3">
                  <div className="bg-slate-100 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0">2</div>
                  <p>Remarkably, exactly <strong>57</strong> sums are Even, and <strong>57</strong> are Odd. (This is difficult to get by luck, ~7% chance).</p>
                </li>
                <li className="flex gap-3">
                  <div className="bg-slate-100 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0">3</div>
                  <p><strong>The Real Miracle:</strong> The sum of the "Odd Result" Surah numbers equals the total sum of the Quran (6555). The sum of the "Even Result" Surah numbers equals the total Ayahs in the Quran (6236).</p>
                </li>
                <li className="flex gap-3">
                  <div className="bg-emerald-100 text-emerald-800 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0">!</div>
                  <p>As you can see in Level 4, while you might hit the 57/57 split by luck, matching the sums is statistically impossible without deliberate placement.</p>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
             {/* Miracle 1: Land and Sea */}
             <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition duration-300 group">
                <div className="h-3 bg-blue-500"></div>
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <Globe className="w-8 h-8 text-blue-500" />
                    <h3 className="text-xl font-bold text-slate-800">Land & Sea Ratio</h3>
                  </div>
                  <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                    The word "Sea" (Al-Bahr) appears 32 times. The word "Land" (Al-Barr) appears 13 times.
                    The sum is 45.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-blue-600">Sea (32/45)</span>
                        <span>71.1%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
                        <div className="bg-blue-500 h-full w-[71.1%]"></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-amber-700">Land (13/45)</span>
                        <span>28.9%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
                        <div className="bg-amber-600 h-full w-[28.9%]"></div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg text-xs text-blue-800 border border-blue-100">
                    Modern science confirms the ratio of water to land on Earth is exactly ~71% to ~29%.
                  </div>
                </div>
             </div>

             {/* Miracle 2: Iron */}
             <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition duration-300 group">
                <div className="h-3 bg-slate-600"></div>
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <Anchor className="w-8 h-8 text-slate-600" />
                    <h3 className="text-xl font-bold text-slate-800">The Iron (Al-Hadid)</h3>
                  </div>
                  <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                    Surah Al-Hadid (Iron) is the 57th chapter. It sits right in the center of the Quran.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-center">
                      <div className="text-3xl font-black text-slate-700">57</div>
                      <div className="text-xs uppercase tracking-wider text-slate-500 mt-1">Surah Number</div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-center">
                      <div className="text-3xl font-black text-slate-700">57</div>
                      <div className="text-xs uppercase tracking-wider text-slate-500 mt-1">Iron Isotope</div>
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-2 text-sm text-slate-600">
                    <p>• The numerical value (Gematria) of the word "Al-Hadid" is exactly 57.</p>
                    <p>• The atomic number of Iron is 26. The gematria of "Hadid" (without Al) is 26.</p>
                  </div>
                </div>
             </div>

             {/* Miracle 3: The Golden Ratio */}
             <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition duration-300 group md:col-span-2">
                <div className="h-3 bg-yellow-500"></div>
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <BookOpen className="w-8 h-8 text-yellow-600" />
                    <h3 className="text-xl font-bold text-slate-800">The Golden Ratio (1.618)</h3>
                  </div>
                  <p className="text-slate-600 mb-4 text-sm leading-relaxed">
                    The Golden Ratio is found in nature, architecture, and aesthetics. It also appears in the Quran's geography.
                  </p>
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 text-sm text-yellow-900">
                    The verse 3:96 mentions the city of Mecca. If you measure the distance from the South Pole to Mecca, and from Mecca to the North Pole, the ratio is exactly 1.618 (Phi).
                  </div>
                </div>
             </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 mt-12 text-center text-sm">
        <p>© 2025 Quranic Symmetry Project. Built for educational verification.</p>
        <p className="mt-2 text-slate-500">Statistical verification powered by pure JavaScript randomness.</p>
      </footer>
    </div>
  );
}
