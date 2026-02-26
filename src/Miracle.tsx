import { useState, useEffect, useMemo } from 'react';
import { Play, RotateCcw, Lock, CheckCircle2, XCircle, Info, BookOpen, Globe, Anchor, Scale, ArrowLeft, Dices, Scissors, Zap } from 'lucide-react';

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

// --- GAME DEFINITIONS ---
const GAMES = [
  {
    id: 'game1' as const,
    title: 'Even/Odd Symmetry',
    subtitle: 'Game 1',
    description: 'Generate random ayah counts and check if the sums of (Surah # + Ayahs) split perfectly into 57 even and 57 odd — just like the real Quran.',
    icon: Scale,
    gradient: 'from-emerald-500 to-teal-600',
    border: 'border-emerald-200 hover:border-emerald-400',
    glow: 'hover:shadow-emerald-200/50',
  },
  {
    id: 'game2' as const,
    title: 'Halving Symmetry',
    subtitle: 'Game 2',
    description: 'Generate random ayah counts for all 114 surahs, split them into two halves (1–57 & 58–114), and check if the count of even-ayah surahs is the same in both halves.',
    icon: Scissors,
    gradient: 'from-violet-500 to-purple-600',
    border: 'border-violet-200 hover:border-violet-400',
    glow: 'hover:shadow-violet-200/50',
  },
];

type GameId = typeof GAMES[number]['id'];

// --- COMPONENT ---

export default function QuranSymmetryGame() {
  // --- Shared State ---
  const [activeTab, setActiveTab] = useState<'game' | 'miracles'>('game');
  const [selectedGame, setSelectedGame] = useState<GameId | null>(null);

  // --- Game 1 State ---
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [surahData, setSurahData] = useState<Array<{ id: number, ayahs: number, sum: number, isEven: boolean }>>([]);
  const [gameStatus, setGameStatus] = useState<'idle' | 'success' | 'fail' | 'perfect'>('idle');

  // --- Game 2 State ---
  const [g2Attempts, setG2Attempts] = useState(0);
  const [g2Wins, setG2Wins] = useState(0);
  const [g2Losses, setG2Losses] = useState(0);
  const [g2Data, setG2Data] = useState<Array<{ id: number, ayahs: number, isEvenAyahs: boolean }>>([]);
  const [g2Status, setG2Status] = useState<'idle' | 'success' | 'fail'>('idle');
  const [g2BatchSize, setG2BatchSize] = useState(1000);

  const currentLevel = LEVELS[currentLevelIdx];

  // Reset game 1 when level changes
  useEffect(() => {
    resetLevel();
  }, [currentLevelIdx]);

  // Reset when switching tabs
  const handleTabChange = (tab: 'game' | 'miracles') => {
    setActiveTab(tab);
    if (tab === 'game') {
      setSelectedGame(null);
    }
  };

  // --- Game 1 Logic ---
  const resetLevel = () => {
    setAttempts(0);
    setGameStatus('idle');
    setSurahData([]);
  };

  const generateRandom = () => {
    setAttempts(prev => prev + 1);
    const newData = Array.from({ length: currentLevel.count }, (_, i) => {
      const surahNum = i + 1;
      const randomAyahs = Math.floor(Math.random() * 284) + 3;
      const sum = surahNum + randomAyahs;
      return { id: surahNum, ayahs: randomAyahs, sum, isEven: sum % 2 === 0 };
    });
    setSurahData(newData);

    const evenCount = newData.filter(d => d.isEven).length;
    const oddCount = newData.length - evenCount;
    const target = currentLevel.count / 2;
    const isSplitCorrect = evenCount === target && oddCount === target;

    if (currentLevel.id === 4) {
      if (isSplitCorrect) {
        const evenGroupSum = newData.filter(d => d.isEven).reduce((acc, curr) => acc + curr.sum, 0);
        const oddGroupSum = newData.filter(d => !d.isEven).reduce((acc, curr) => acc + curr.sum, 0);
        const isPerfect = (oddGroupSum === QURAN_ODD_GROUP_SUM && evenGroupSum === QURAN_EVEN_GROUP_SUM);
        setGameStatus(isPerfect ? 'perfect' : 'success');
      } else {
        setGameStatus('fail');
      }
    } else {
      setGameStatus(isSplitCorrect ? 'success' : 'fail');
    }
  };

  const evenCount = surahData.filter(d => d.isEven).length;
  const oddCount = surahData.length - evenCount;
  const targetHalf = currentLevel.count / 2;

  const calculateProbability = (n: number) => {
    if (n > 50) return "Low (<8%)";
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

  // --- Game 2 Logic ---
  const generateGame2 = () => {
    setG2Attempts(prev => prev + 1);
    const newData = Array.from({ length: 114 }, (_, i) => {
      const surahNum = i + 1;
      const randomAyahs = Math.floor(Math.random() * 284) + 3;
      return { id: surahNum, ayahs: randomAyahs, isEvenAyahs: randomAyahs % 2 === 0 };
    });
    setG2Data(newData);

    const firstHalf = newData.slice(0, 57);
    const secondHalf = newData.slice(57);
    const evenInFirst = firstHalf.filter(d => d.isEvenAyahs).length;
    const evenInSecond = secondHalf.filter(d => d.isEvenAyahs).length;

    const isMatch = evenInFirst === evenInSecond;
    setG2Status(isMatch ? 'success' : 'fail');
    if (isMatch) {
      setG2Wins(prev => prev + 1);
    } else {
      setG2Losses(prev => prev + 1);
    }
  };

  const runBatchGame2 = () => {
    let batchWins = 0;
    let batchLosses = 0;
    const iterations = Math.max(1, Math.min(g2BatchSize, 100000));

    for (let i = 0; i < iterations; i++) {
      let evenInFirst = 0;
      let evenInSecond = 0;
      for (let s = 0; s < 114; s++) {
        const randomAyahs = Math.floor(Math.random() * 284) + 3;
        const isEven = randomAyahs % 2 === 0;
        if (isEven) {
          if (s < 57) evenInFirst++;
          else evenInSecond++;
        }
      }
      if (evenInFirst === evenInSecond) batchWins++;
      else batchLosses++;
    }

    setG2Attempts(prev => prev + iterations);
    setG2Wins(prev => prev + batchWins);
    setG2Losses(prev => prev + batchLosses);
    setG2Data([]);
    setG2Status('idle');
  };

  const resetGame2 = () => {
    setG2Attempts(0);
    setG2Wins(0);
    setG2Losses(0);
    setG2Data([]);
    setG2Status('idle');
  };

  const g2FirstHalf = g2Data.slice(0, 57);
  const g2SecondHalf = g2Data.slice(57);
  const g2EvenFirst = g2FirstHalf.filter(d => d.isEvenAyahs).length;
  const g2EvenSecond = g2SecondHalf.filter(d => d.isEvenAyahs).length;

  // --- RENDER ---

  const renderGameHub = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Choose a Simulation</h2>
        <p className="text-slate-500 text-sm max-w-lg mx-auto">
          Each game demonstrates a different mathematical pattern found in the Quran that is virtually impossible to replicate by chance.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {GAMES.map((game) => {
          const Icon = game.icon;
          return (
            <button
              key={game.id}
              onClick={() => setSelectedGame(game.id)}
              className={`group relative bg-white rounded-2xl shadow-md overflow-hidden border-2 ${game.border} text-left transition-all duration-300 hover:shadow-xl ${game.glow} hover:-translate-y-1`}
            >
              {/* Top gradient bar */}
              <div className={`h-2 bg-gradient-to-r ${game.gradient}`} />

              <div className="p-8">
                {/* Badge */}
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${game.gradient} mb-4`}>
                  <Dices className="w-3 h-3" />
                  {game.subtitle}
                </div>

                {/* Icon + Title */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${game.gradient} text-white shadow-lg`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 group-hover:text-slate-900 transition-colors">
                    {game.title}
                  </h3>
                </div>

                {/* Description */}
                <p className="text-slate-500 text-sm leading-relaxed">
                  {game.description}
                </p>

                {/* CTA */}
                <div className={`mt-6 inline-flex items-center gap-2 text-sm font-semibold bg-gradient-to-r ${game.gradient} bg-clip-text text-transparent`}>
                  Play Now
                  <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderBackButton = () => (
    <button
      onClick={() => setSelectedGame(null)}
      className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-emerald-700 transition-colors mb-6 group"
    >
      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
      Back to Games
    </button>
  );

  const renderGame1 = () => (
    <div className="space-y-8">
      {renderBackButton()}

      {/* Level Selector */}
      <div className="flex flex-wrap gap-4 justify-center">
        {LEVELS.map((lvl, idx) => (
          <button
            key={lvl.id}
            onClick={() => setCurrentLevelIdx(idx)}
            disabled={idx > currentLevelIdx && idx > 0 && false}
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
                      ? <CheckCircle2 className="text-green-500 w-5 h-5" />
                      : <span className="text-red-500 text-xs">(Target: {QURAN_ODD_GROUP_SUM})</span>}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Sum of Even Group</div>
                  <div className="font-mono text-xl flex items-center gap-2">
                    {sums.even}
                    {sums.even === QURAN_EVEN_GROUP_SUM
                      ? <CheckCircle2 className="text-green-500 w-5 h-5" />
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
          <div className={`p-4 text-center border-b ${gameStatus === 'fail' ? 'bg-amber-50 text-amber-800 border-amber-100' :
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
                <div key={data.id} className={`p-2 rounded border text-xs flex flex-col items-center transition-all ${data.isEven ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'
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
  );

  const renderGame2 = () => (
    <div className="space-y-8">
      {renderBackButton()}

      {/* Game Board */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        <div className="p-8 text-center bg-gradient-to-br from-violet-900 to-purple-900 text-white">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white bg-white/20 mb-4">
            <Scissors className="w-3 h-3" />
            Game 2
          </div>
          <h2 className="text-2xl font-bold mb-2">Halving Symmetry</h2>
          <p className="text-purple-200 max-w-2xl mx-auto text-sm">
            Generate random ayah counts for all 114 surahs. Split them in half (1–57 & 58–114) and check if the number of surahs with <strong>even</strong> ayah counts is the same in both halves.
          </p>

          {/* Scoreboard */}
          <div className="mt-8 flex justify-center items-center gap-8">
            <div className="text-center">
              <div className="text-xs uppercase tracking-widest text-purple-300 mb-1">First Half (1–57)</div>
              <div className="text-xs uppercase tracking-widest text-purple-400 mb-1">Even Ayah Surahs</div>
              <div className={`text-4xl font-mono font-bold ${g2Data.length > 0 && g2EvenFirst === g2EvenSecond ? 'text-green-400' : 'text-white'}`}>
                {g2Data.length > 0 ? g2EvenFirst : '—'}
              </div>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-sm font-bold ${g2Status === 'idle' ? 'border-purple-500 text-purple-300' :
                g2Status === 'success' ? 'border-green-400 text-green-400 bg-green-400/10' :
                  'border-red-400 text-red-400 bg-red-400/10'
                }`}>
                {g2Status === 'idle' ? 'vs' : g2Status === 'success' ? '=' : '≠'}
              </div>
            </div>

            <div className="text-center">
              <div className="text-xs uppercase tracking-widest text-purple-300 mb-1">Second Half (58–114)</div>
              <div className="text-xs uppercase tracking-widest text-purple-400 mb-1">Even Ayah Surahs</div>
              <div className={`text-4xl font-mono font-bold ${g2Data.length > 0 && g2EvenFirst === g2EvenSecond ? 'text-green-400' : 'text-white'}`}>
                {g2Data.length > 0 ? g2EvenSecond : '—'}
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {/* Manual generate */}
            <button
              onClick={generateGame2}
              className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-violet-600 rounded-full hover:bg-violet-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-600"
            >
              <Dices className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              Generate Random Ayahs
            </button>

            {/* Batch simulation */}
            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center bg-white/10 rounded-full border border-purple-400/30 overflow-hidden">
                <input
                  type="number"
                  min={1}
                  max={100000}
                  value={g2BatchSize}
                  onChange={(e) => setG2BatchSize(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24 px-3 py-2 bg-transparent text-white text-center text-sm font-mono focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <button
                onClick={runBatchGame2}
                className="group inline-flex items-center justify-center px-6 py-2.5 font-semibold text-sm text-white transition-all duration-200 bg-amber-500 rounded-full hover:bg-amber-400 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
              >
                <Zap className="w-4 h-4 mr-1.5 group-hover:scale-110 transition-transform" />
                Run Batch
              </button>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center gap-4 text-xs">
              <span className="text-purple-400">Attempts: {g2Attempts.toLocaleString()}</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 font-semibold">
                <CheckCircle2 className="w-3 h-3" /> {g2Wins.toLocaleString()} Win{g2Wins !== 1 ? 's' : ''}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-semibold">
                <XCircle className="w-3 h-3" /> {g2Losses.toLocaleString()} Loss{g2Losses !== 1 ? 'es' : ''}
              </span>
              {g2Attempts > 0 && (
                <span className="text-purple-300 font-semibold">
                  ({((g2Wins / g2Attempts) * 100).toFixed(2)}% win rate)
                </span>
              )}
              {g2Attempts > 0 && (
                <button
                  onClick={resetGame2}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-purple-300 hover:text-white hover:bg-white/20 transition-colors font-semibold"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status Message */}
        {g2Status !== 'idle' && (
          <div className={`p-4 text-center border-b ${g2Status === 'fail' ? 'bg-amber-50 text-amber-800 border-amber-100' :
            'bg-emerald-50 text-emerald-800 border-emerald-100'
            }`}>
            <div className="flex items-center justify-center gap-2 font-bold">
              {g2Status === 'fail' && <XCircle className="w-6 h-6" />}
              {g2Status === 'success' && <CheckCircle2 className="w-6 h-6" />}
              <span>
                {g2Status === 'fail' && `Mismatch! First half has ${g2EvenFirst} even-ayah surahs, second half has ${g2EvenSecond}.`}
                {g2Status === 'success' && `Symmetry! Both halves have exactly ${g2EvenFirst} surahs with even ayah counts.`}
              </span>
            </div>
          </div>
        )}

        {/* Visualization — Two Halves Side-by-Side */}
        <div className="p-6 bg-slate-50 min-h-[300px] max-h-[600px] overflow-y-auto">
          {g2Data.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 mt-20">
              <RotateCcw className="w-12 h-12 mb-4 opacity-20" />
              <p>Press Generate to create random ayah counts for 114 Surahs</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {/* First Half */}
              <div>
                <h4 className="text-sm font-bold text-slate-600 mb-3 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-violet-500"></div>
                  First Half — Surahs 1–57
                  <span className="ml-auto text-xs font-normal text-slate-400">{g2EvenFirst} even</span>
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                  {g2FirstHalf.map((d) => (
                    <div key={d.id} className={`p-1.5 rounded border text-[10px] flex flex-col items-center transition-all ${d.isEvenAyahs ? 'bg-violet-50 border-violet-200' : 'bg-slate-50 border-slate-200'
                      }`}>
                      <div className="font-bold opacity-50">S{d.id}</div>
                      <div className={`font-mono font-bold ${d.isEvenAyahs ? 'text-violet-600' : 'text-slate-400'}`}>
                        {d.ayahs}
                      </div>
                      <div className={`text-[8px] ${d.isEvenAyahs ? 'text-violet-500' : 'text-slate-400'}`}>
                        {d.isEvenAyahs ? 'EVEN' : 'ODD'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Second Half */}
              <div>
                <h4 className="text-sm font-bold text-slate-600 mb-3 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  Second Half — Surahs 58–114
                  <span className="ml-auto text-xs font-normal text-slate-400">{g2EvenSecond} even</span>
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                  {g2SecondHalf.map((d) => (
                    <div key={d.id} className={`p-1.5 rounded border text-[10px] flex flex-col items-center transition-all ${d.isEvenAyahs ? 'bg-purple-50 border-purple-200' : 'bg-slate-50 border-slate-200'
                      }`}>
                      <div className="font-bold opacity-50">S{d.id}</div>
                      <div className={`font-mono font-bold ${d.isEvenAyahs ? 'text-purple-600' : 'text-slate-400'}`}>
                        {d.ayahs}
                      </div>
                      <div className={`text-[8px] ${d.isEvenAyahs ? 'text-purple-500' : 'text-slate-400'}`}>
                        {d.isEvenAyahs ? 'EVEN' : 'ODD'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Explanation Block */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-violet-600" />
          How this proves design
        </h3>
        <ul className="space-y-3 text-slate-600 text-sm">
          <li className="flex gap-3">
            <div className="bg-slate-100 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0">1</div>
            <p>The Quran has 114 surahs. If you split them in half (surahs 1–57 and 58–114), each half has exactly the same number of surahs with an <strong>even</strong> number of ayahs.</p>
          </li>
          <li className="flex gap-3">
            <div className="bg-slate-100 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0">2</div>
            <p>In this simulation, we assign <strong>random</strong> ayah counts to all 114 surahs and check whether this symmetry occurs.</p>
          </li>
          <li className="flex gap-3">
            <div className="bg-slate-100 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0">3</div>
            <p>You'll find that getting both halves to match is surprisingly difficult — demonstrating that the real Quran's structure is not random.</p>
          </li>
          <li className="flex gap-3">
            <div className="bg-violet-100 text-violet-800 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0">!</div>
            <p>This is yet another layer of mathematical symmetry on top of the even/odd sum miracle, making a random origin statistically implausible.</p>
          </li>
        </ul>
      </div>
    </div>
  );

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
              onClick={() => handleTabChange('game')}
              className={`px-4 py-2 rounded-full font-semibold transition ${activeTab === 'game' ? 'bg-white text-emerald-800' : 'bg-emerald-800 text-white hover:bg-emerald-600'}`}
            >
              The Simulation
            </button>
            <button
              onClick={() => handleTabChange('miracles')}
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
          selectedGame === null ? renderGameHub() :
            selectedGame === 'game1' ? renderGame1() :
              renderGame2()
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
