import { useState, useEffect, useMemo } from 'react';
import { Play, RotateCcw, Lock, CheckCircle2, XCircle, Info, BookOpen, Globe, Anchor, Scale, ArrowLeft, Dices, Scissors, Zap } from 'lucide-react';

// --- CONSTANTS & DATA ---

// The "Target" sums found in the actual Quran for the 57/57 even/odd groups
const GOLDEN_RATIO = 1.6180339887;

const LEVELS = [
  { id: 1, count: 4, name: "The Starter", description: "Try to balance 4 Surahs (2 Even / 2 Odd)." },
  { id: 2, count: 10, name: "The Novice", description: "Try to balance 10 Surahs (5 Even / 5 Odd)." },
  { id: 3, count: 40, name: "The Scholar", description: "Try to balance 40 Surahs (20 Even / 20 Odd)." },
  { id: 4, count: 80, name: "The Hafiz", description: "Try to balance 80 Surahs (40 Even / 40 Odd)." },
  { id: 5, count: 114, name: "The Miracle", description: "The Ultimate Challenge: 114 Surahs with Perfect Sums." }
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
  {
    id: 'game3' as const,
    title: 'Repeated / Non-Repeated Codes',
    subtitle: 'Game 3',
    description: 'Generate random ayahs and calculate codes. Check if the ratio of the sum of repeated codes to non-repeated codes is close to the Golden Ratio (1.618).',
    icon: Dices,
    gradient: 'from-orange-500 to-red-600',
    border: 'border-orange-200 hover:border-orange-400',
    glow: 'hover:shadow-orange-200/50',
  },
  {
    id: 'game4' as const,
    title: 'The Primes Miracle',
    subtitle: 'Game 4',
    description: 'Check if the sum of prime ayah counts plus their corresponding nth primes equals the total number of ayahs.',
    icon: Dices,
    gradient: 'from-blue-500 to-indigo-600',
    border: 'border-blue-200 hover:border-blue-400',
    glow: 'hover:shadow-blue-200/50',
  },
];

type GameId = typeof GAMES[number]['id'] | 'game4';




function isPrime(num: number): boolean {
  if (num <= 1) return false;
  if (num <= 3) return true;
  if (num % 2 === 0 || num % 3 === 0) return false;
  let i = 5;
  while (i * i <= num) {
    if (num % i === 0 || num % (i + 2) === 0) return false;
    i += 6;
  }
  return true;
}

const PRIMES: number[] = [];
let _num = 2;
while (PRIMES.length < 300) {
  if (isPrime(_num)) {
    PRIMES.push(_num);
  }
  _num++;
}

function getNthPrime(n: number): number {
  if (n <= 0) return 0;
  return PRIMES[n - 1] || 0;
}

function getGoldenRatioStats(a: number, b: number) {
  if (a === 0 || b === 0) {
    return { ratio: 0, difference: 0, isClose: false, valid: false };
  }

  const ratio1 = a / b;
  const ratio2 = b / a;

  const diff1 = Math.abs(ratio1 - GOLDEN_RATIO);
  const diff2 = Math.abs(ratio2 - GOLDEN_RATIO);

  const closestRatio = diff1 < diff2 ? ratio1 : ratio2;
  const closestDiff = Math.min(diff1, diff2);

  return {
    ratio: closestRatio,
    difference: closestDiff,
    isClose: closestRatio >= 1.5 && closestRatio <= 2.0,
    valid: true,
  };
}

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
  const [g2LevelIdx, setG2LevelIdx] = useState(0);
  const [g2Attempts, setG2Attempts] = useState(0);
  const [g2Wins, setG2Wins] = useState(0);
  const [g2Losses, setG2Losses] = useState(0);
  const [g2Data, setG2Data] = useState<Array<{ id: number, ayahs: number, isEvenAyahs: boolean }>>([]);
  const [g2Status, setG2Status] = useState<'idle' | 'success' | 'fail'>('idle');
  const [g2BatchSize, setG2BatchSize] = useState(1000);

  // --- Game 3 State ---
  const [g3LevelIdx, setG3LevelIdx] = useState(0);
  const [g3Attempts, setG3Attempts] = useState(0);
  const [g3Wins, setG3Wins] = useState(0);
  const [g3Losses, setG3Losses] = useState(0);
  const [g3Data, setG3Data] = useState<Array<{ id: number, ayahs: number, code: number, isRepeated: boolean }>>([]);
  const [g3Status, setG3Status] = useState<'idle' | 'success' | 'fail' | 'perfect'>('idle');
  const [g3BatchSize, setG3BatchSize] = useState(1000);
  const [g3BatchResults, setG3BatchResults] = useState<{A: number, B: number, ratio: number, success: boolean}[]>([]);
  const [isG3AutoRunning, setIsG3AutoRunning] = useState(false);


  // --- Game 4 State ---
  const [g4LevelIdx, setG4LevelIdx] = useState(0);
  const [isG4AutoRunning, setIsG4AutoRunning] = useState(false);
  const [g4Attempts, setG4Attempts] = useState(0);
  const [g4Wins, setG4Wins] = useState(0);
  const [g4Losses, setG4Losses] = useState(0);
  const [g4Data, setG4Data] = useState<Array<{ id: number, ayahs: number, isPrimeAyahs: boolean, nthPrime: number }>>([]);
  const [g4Status, setG4Status] = useState<'idle' | 'success' | 'fail'>('idle');
  const [g4BatchSize, setG4BatchSize] = useState(1000);

  const currentLevel = LEVELS[currentLevelIdx];

  // Reset game 1 when level changes
  useEffect(() => {
    resetLevel();
  }, [currentLevelIdx]);

  // Reset game 2 when level changes
  useEffect(() => {
    resetGame2();
  }, [g2LevelIdx]);

  const resetGame4 = () => {
    setG4Attempts(0);
    setG4Wins(0);
    setG4Losses(0);
    setG4Data([]);
    setG4Status('idle');
    setIsG4AutoRunning(false);
  };

  useEffect(() => {
    resetGame4();
  }, [g4LevelIdx]);

  // Auto-run effect for Game 3
  useEffect(() => {
    let timeoutId: number;
    if (isG3AutoRunning) {
      const runCycle = () => {
        runBatchGame3(100000);
        timeoutId = setTimeout(runCycle, 0) as unknown as number;
      };
      timeoutId = setTimeout(runCycle, 0) as unknown as number;
    }
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isG3AutoRunning, g3LevelIdx]); // Intentionally not including runBatchGame3 to avoid unnecessary re-renders

  // Auto-run effect for Game 4
  useEffect(() => {
    let timeoutId: number;
    if (isG4AutoRunning) {
      const runCycle = () => {
        runBatchGame4(100000);
        timeoutId = setTimeout(runCycle, 0) as unknown as number;
      };
      timeoutId = setTimeout(runCycle, 0) as unknown as number;
    }
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isG4AutoRunning, g4LevelIdx]); // Intentionally not including runBatchGame4 to avoid unnecessary re-renders

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

    if (isSplitCorrect) {
      const evenGroupSum = newData.filter(d => d.isEven).reduce((acc, curr) => acc + curr.sum, 0);
      const oddGroupSum = newData.filter(d => !d.isEven).reduce((acc, curr) => acc + curr.sum, 0);
      const targetSurahsOrder = currentLevel.count * (currentLevel.count + 1) / 2;
      const targetTotalAyahs = newData.reduce((acc, curr) => acc + curr.ayahs, 0);

      const isPerfect = (oddGroupSum === targetSurahsOrder && evenGroupSum === targetTotalAyahs) ||
                        (oddGroupSum === targetTotalAyahs && evenGroupSum === targetSurahsOrder);
      setGameStatus(isPerfect ? 'perfect' : 'success');
    } else {
      setGameStatus('fail');
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
    const count = LEVELS[g2LevelIdx].count;
    const half = count / 2;
    const newData = Array.from({ length: count }, (_, i) => {
      const surahNum = i + 1;
      const randomAyahs = Math.floor(Math.random() * 284) + 3;
      return { id: surahNum, ayahs: randomAyahs, isEvenAyahs: randomAyahs % 2 === 0 };
    });
    setG2Data(newData);

    const firstHalf = newData.slice(0, half);
    const secondHalf = newData.slice(half);
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
    const count = LEVELS[g2LevelIdx].count;
    const half = count / 2;

    for (let i = 0; i < iterations; i++) {
      let evenInFirst = 0;
      let evenInSecond = 0;
      for (let s = 0; s < count; s++) {
        const randomAyahs = Math.floor(Math.random() * 284) + 3;
        const isEven = randomAyahs % 2 === 0;
        if (isEven) {
          if (s < half) evenInFirst++;
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

  const g2Count = LEVELS[g2LevelIdx].count;
  const g2Half = g2Count / 2;
  const g2FirstHalf = g2Data.slice(0, g2Half);
  const g2SecondHalf = g2Data.slice(g2Half);
  const g2EvenFirst = g2FirstHalf.filter(d => d.isEvenAyahs).length;
  const g2EvenSecond = g2SecondHalf.filter(d => d.isEvenAyahs).length;

  // --- Game 3 Logic ---
  const generateGame3 = () => {
    setG3Attempts(prev => prev + 1);
    const count = LEVELS[g3LevelIdx].count;

    // Generate codes
    const newData = Array.from({ length: count }, (_, i) => {
      const surahNum = i + 1;
      const randomAyahs = Math.floor(Math.random() * 284) + 3;
      const code = surahNum + randomAyahs;
      return { id: surahNum, ayahs: randomAyahs, code, isRepeated: false };
    });

    // Count frequencies
    const codeCounts: Record<number, number> = {};
    newData.forEach(d => {
      codeCounts[d.code] = (codeCounts[d.code] || 0) + 1;
    });

    // Classify as repeated or non-repeated
    let sumRepeated = 0;
    let sumNonRepeated = 0;
    newData.forEach(d => {
      if (codeCounts[d.code] > 1) {
        d.isRepeated = true;
        sumRepeated += d.code;
      } else {
        sumNonRepeated += d.code;
      }
    });

    setG3Data(newData);

    const stats = getGoldenRatioStats(sumRepeated, sumNonRepeated);
    const targetSurahsOrder = count * (count + 1) / 2;
    const targetTotalAyahs = newData.reduce((acc, curr) => acc + curr.ayahs, 0);

    const isPerfect = (sumRepeated === targetSurahsOrder && sumNonRepeated === targetTotalAyahs) ||
                      (sumRepeated === targetTotalAyahs && sumNonRepeated === targetSurahsOrder);

    if (isPerfect) {
      setG3Status('perfect');
    } else {
      setG3Status(stats.isClose ? 'success' : 'fail');
    }
  };

  const runBatchGame3 = (overrideIterations?: number) => {
    let batchWins = 0;
    let batchLosses = 0;
    const iterations = overrideIterations !== undefined ? overrideIterations : Math.max(1, Math.min(g3BatchSize, 100000));
    const count = LEVELS[g3LevelIdx].count;
    const batchResults = [];

    for (let i = 0; i < iterations; i++) {
      const codeCounts: Record<number, number> = {};
      const codes = [];
      for (let s = 0; s < count; s++) {
        const surahNum = s + 1;
        const randomAyahs = Math.floor(Math.random() * 284) + 3;
        const code = surahNum + randomAyahs;
        codes.push(code);
        codeCounts[code] = (codeCounts[code] || 0) + 1;
      }

      let sumRepeated = 0;
      let sumNonRepeated = 0;
      for (let j = 0; j < codes.length; j++) {
        const code = codes[j];
        if (codeCounts[code] > 1) {
          sumRepeated += code;
        } else {
          sumNonRepeated += code;
        }
      }
      const stats = getGoldenRatioStats(sumRepeated, sumNonRepeated);
      const success = stats.isClose;

      batchResults.push({
        A: sumRepeated,
        B: sumNonRepeated,
        ratio: stats.ratio,
        success
      });

      if (success) {
        batchWins++;
      } else {
        batchLosses++;
      }
    }

    setG3BatchResults(batchResults);
    setG3Attempts(prev => prev + iterations);
    setG3Wins(prev => prev + batchWins);
    setG3Losses(prev => prev + batchLosses);
  };

  const resetGame3 = () => {
    setG3Attempts(0);
    setG3Wins(0);
    setG3Losses(0);
    setG3Data([]);
    setG3Status('idle');
    setG3LevelIdx(0);
  };

  const g3Sums = useMemo(() => {
    let repeated = 0;
    let nonRepeated = 0;
    let even = 0;
    let odd = 0;
    g3Data.forEach(d => {
      if (d.isRepeated) repeated += d.code;
      else nonRepeated += d.code;

      if (d.code % 2 === 0) even += d.code;
      else odd += d.code;
    });
    return { repeated, nonRepeated, even, odd };
  }, [g3Data]);

  // --- RENDER ---


  // --- Game 4 Logic ---
  const generateGame4 = () => {
    setG4Attempts(prev => prev + 1);

    const count = LEVELS[g4LevelIdx].count;
    let totalAyahs = 0;

    const newData = Array.from({ length: count }, (_, i) => {
      const surahNum = i + 1;
      const randomAyahs = Math.floor(Math.random() * 284) + 3;
      totalAyahs += randomAyahs;

      const isPrimeAyahs = isPrime(randomAyahs);
      const nthPrime = isPrimeAyahs ? getNthPrime(randomAyahs) : 0;

      return { id: surahNum, ayahs: randomAyahs, isPrimeAyahs, nthPrime };
    });

    setG4Data(newData);

    let sumPrimeAyahs = 0;
    let sumNthPrimes = 0;

    newData.forEach(d => {
      if (d.isPrimeAyahs) {
        sumPrimeAyahs += d.ayahs;
        sumNthPrimes += d.nthPrime;
      }
    });

    const totalPrimesSum = sumPrimeAyahs + sumNthPrimes;

    if (totalPrimesSum === totalAyahs) {
      setG4Status('success');
      setG4Wins(prev => prev + 1);
    } else {
      setG4Status('fail');
      setG4Losses(prev => prev + 1);
    }
  };

  const runBatchGame4 = (overrideIterations?: number) => {
    let batchWins = 0;
    let batchLosses = 0;
    const iterations = overrideIterations !== undefined ? overrideIterations : Math.max(1, Math.min(g4BatchSize, 100000));
    const count = LEVELS[g4LevelIdx].count;

    for (let i = 0; i < iterations; i++) {
      let totalAyahs = 0;
      let sumPrimeAyahs = 0;
      let sumNthPrimes = 0;

      for (let s = 0; s < count; s++) {
        const randomAyahs = Math.floor(Math.random() * 284) + 3;
        totalAyahs += randomAyahs;

        if (isPrime(randomAyahs)) {
          sumPrimeAyahs += randomAyahs;
          sumNthPrimes += getNthPrime(randomAyahs);
        }
      }

      const totalPrimesSum = sumPrimeAyahs + sumNthPrimes;
      if (totalPrimesSum === totalAyahs) {
        batchWins++;
      } else {
        batchLosses++;
      }
    }

    setG4Wins(prev => prev + batchWins);
    setG4Losses(prev => prev + batchLosses);
    setG4Attempts(prev => prev + iterations);
  };

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

          {/* Divine Design Verification Display */}
          {surahData.length > 0 && (
            <div className="mt-8 bg-slate-800 p-4 rounded-lg inline-block border border-slate-700">
              <h3 className="text-emerald-400 text-sm font-bold uppercase tracking-wider mb-3">Divine Design Verification</h3>
              <div className="grid grid-cols-2 gap-8 text-left">
                <div>
                  <div className="text-xs text-slate-400">Sum of Odd Group</div>
                  <div className="font-mono text-xl flex items-center gap-2">
                    {sums.odd}
                    {(sums.odd === (currentLevel.count * (currentLevel.count + 1) / 2) || sums.odd === surahData.reduce((a, b) => a + b.ayahs, 0))
                      ? <CheckCircle2 className="text-green-500 w-5 h-5" />
                      : <span className="text-red-500 text-xs">(Targets: {currentLevel.count * (currentLevel.count + 1) / 2} or {surahData.reduce((a, b) => a + b.ayahs, 0)})</span>}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Sum of Even Group</div>
                  <div className="font-mono text-xl flex items-center gap-2">
                    {sums.even}
                    {(sums.even === (currentLevel.count * (currentLevel.count + 1) / 2) || sums.even === surahData.reduce((a, b) => a + b.ayahs, 0))
                      ? <CheckCircle2 className="text-green-500 w-5 h-5" />
                      : <span className="text-red-500 text-xs">(Targets: {currentLevel.count * (currentLevel.count + 1) / 2} or {surahData.reduce((a, b) => a + b.ayahs, 0)})</span>}
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
                {gameStatus === 'success' && "Symmetry Achieved! You beat the odds, but the sums do not match the Divine Design exactly."}
                {gameStatus === 'perfect' && "SUBHANALLAH! Impossible Match Found!"}
              </span>
            </div>
            {gameStatus === 'success' && (
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
            <div className="grid md:grid-cols-2 gap-6">
              {/* Even Results */}
              <div>
                <h4 className="text-sm font-bold text-slate-600 mb-3 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  Even Results
                  <span className="ml-auto text-xs font-normal text-slate-400">{surahData.filter(d => d.isEven).length} surahs</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {surahData.filter(d => d.isEven).map((data) => (
                    <div key={data.id} className="p-2 rounded border text-xs flex flex-col items-center transition-all bg-blue-50 border-blue-200">
                      <div className="font-bold opacity-50">Surah {data.id}</div>
                      <div className="text-[10px] text-slate-500">{data.ayahs} Ayahs</div>
                      <div className="font-mono font-bold mt-1 text-blue-600">
                        Sum: {data.sum}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Odd Results */}
              <div>
                <h4 className="text-sm font-bold text-slate-600 mb-3 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  Odd Results
                  <span className="ml-auto text-xs font-normal text-slate-400">{surahData.filter(d => !d.isEven).length} surahs</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {surahData.filter(d => !d.isEven).map((data) => (
                    <div key={data.id} className="p-2 rounded border text-xs flex flex-col items-center transition-all bg-orange-50 border-orange-200">
                      <div className="font-bold opacity-50">Surah {data.id}</div>
                      <div className="text-[10px] text-slate-500">{data.ayahs} Ayahs</div>
                      <div className="font-mono font-bold mt-1 text-orange-600">
                        Sum: {data.sum}
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
          <Info className="w-5 h-5 text-emerald-600" />
          How this proves design
        </h3>
        <ul className="space-y-3 text-slate-600 text-sm">
          <li className="flex gap-3">
            <div className="bg-slate-100 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0">1</div>
            <p>In the real Quran, there are 114 Surahs. The "Sum" is calculated by adding the Surah Number + Number of Ayahs.</p>
          </li>
          <li className="flex gap-3">
            <div className="bg-slate-100 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0">2</div>
            <p>Remarkably, exactly <strong>half</strong> the sums are Even, and <strong>half</strong> are Odd. (This is difficult to get by luck as you scale up).</p>
          </li>
          <li className="flex gap-3">
            <div className="bg-slate-100 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0">3</div>
            <p><strong>The Real Miracle:</strong> The sum of one group equals the total Surahs order (e.g. 6555 for 114 Surahs). The sum of the other group equals the total Ayahs in the generated book (e.g. 6236 for the real Quran).</p>
          </li>
          <li className="flex gap-3">
            <div className="bg-emerald-100 text-emerald-800 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0">!</div>
            <p>As you can see, while you might occasionally hit the perfect split by luck, matching the sums to the Divine Design is statistically virtually impossible.</p>
          </li>
        </ul>
      </div>
    </div>
  );


  const renderGame3 = () => {
    const ratio = g3Sums.nonRepeated !== 0 ? (g3Sums.repeated / g3Sums.nonRepeated).toFixed(3) : '0';

    const repStats = getGoldenRatioStats(g3Sums.repeated, g3Sums.nonRepeated);
    const evenOddStats = getGoldenRatioStats(g3Sums.even, g3Sums.odd);

    return (
      <div className="space-y-8">
        {renderBackButton()}

        {/* Game Board */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
          <div className="p-8 text-center bg-gradient-to-br from-orange-600 to-red-700 text-white">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white bg-white/20 mb-4">
              <Dices className="w-3 h-3" />
              Game 3
            </div>
            <h2 className="text-2xl font-bold mb-2">Repeated / Non-Repeated Codes</h2>
            <p className="text-orange-200 max-w-2xl mx-auto text-sm">
              Generate random ayahs. Compute (Surah + Ayahs) = Code. Sum all repeated codes (A) and non-repeated codes (B). Win if the closest ratio is ≈ Golden Ratio (tolerance up to 2.0).
            </p>

            {/* Scoreboard */}
            <div className="mt-8 flex justify-center items-center gap-8">
              <div className="text-center">
                <div className="text-xs uppercase tracking-widest text-orange-300 mb-1">Repeated (A)</div>
                <div className="text-2xl font-mono font-bold text-white">
                  {g3Data.length > 0 ? g3Sums.repeated : '—'}
                </div>
              </div>

              <div className="flex flex-col items-center gap-1">
                <div className={`w-20 h-20 rounded-full border-2 flex flex-col items-center justify-center ${g3Status === 'idle' ? 'border-orange-500 text-orange-300' :
                  (g3Status === 'success' || g3Status === 'perfect') ? 'border-green-400 text-green-400 bg-green-400/10' :
                    'border-red-400 text-red-400 bg-red-400/10'
                  }`}>
                  <div className="text-lg font-bold">
                    {g3Data.length > 0 ? (`${ratio}`) : 'A/B'}
                  </div>
                  <div className="text-[9px] uppercase tracking-wider opacity-80 mt-0.5 font-bold">
                    Target 1.618
                  </div>
                </div>
                {g3Status !== 'idle' && (
                  <span className={`text-xs font-bold ${(g3Status === 'success' || g3Status === 'perfect') ? 'text-green-400' : 'text-red-400'}`}>
                    {(g3Status === 'success' || g3Status === 'perfect') ? 'WIN' : 'FAIL'}
                  </span>
                )}
              </div>

              <div className="text-center">
                <div className="text-xs uppercase tracking-widest text-orange-300 mb-1">Non-Repeated (B)</div>
                <div className="text-2xl font-mono font-bold text-white">
                  {g3Data.length > 0 ? g3Sums.nonRepeated : '—'}
                </div>
              </div>
            </div>

            {/* Divine Design Verification Display */}
            {g3Data.length > 0 && (
              <div className="mt-8 bg-black/20 p-4 rounded-lg inline-block border border-orange-500/30 text-left">
                <h3 className="text-orange-400 text-sm font-bold uppercase tracking-wider mb-3 text-center">Divine Design Verification</h3>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <div className="text-xs text-orange-300/70">Repeated (A)</div>
                    <div className="font-mono text-xl flex items-center gap-2">
                      {g3Sums.repeated}
                      {(g3Sums.repeated === (LEVELS[g3LevelIdx].count * (LEVELS[g3LevelIdx].count + 1) / 2) || g3Sums.repeated === g3Data.reduce((a, b) => a + b.ayahs, 0))
                        ? <CheckCircle2 className="text-green-400 w-5 h-5" />
                        : <span className="text-red-400 text-xs">(Targets: {LEVELS[g3LevelIdx].count * (LEVELS[g3LevelIdx].count + 1) / 2} or {g3Data.reduce((a, b) => a + b.ayahs, 0)})</span>}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-orange-300/70">Non-Repeated (B)</div>
                    <div className="font-mono text-xl flex items-center gap-2">
                      {g3Sums.nonRepeated}
                      {(g3Sums.nonRepeated === (LEVELS[g3LevelIdx].count * (LEVELS[g3LevelIdx].count + 1) / 2) || g3Sums.nonRepeated === g3Data.reduce((a, b) => a + b.ayahs, 0))
                        ? <CheckCircle2 className="text-green-400 w-5 h-5" />
                        : <span className="text-red-400 text-xs">(Targets: {LEVELS[g3LevelIdx].count * (LEVELS[g3LevelIdx].count + 1) / 2} or {g3Data.reduce((a, b) => a + b.ayahs, 0)})</span>}
                    </div>
                  </div>
                </div>
                {g3Status === 'perfect' && (
                  <div className="mt-4 p-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded text-center font-bold">
                    <CheckCircle2 className="inline w-5 h-5 mr-2" />
                    SUBHANALLAH! Impossible Match Found!
                  </div>
                )}
              </div>
            )}

            {/* Golden Ratio Check */}
            {g3Data.length > 0 && (
              <div className="mt-8 bg-white/10 rounded-xl p-6 border border-white/20 text-left">
                <h3 className="text-lg font-bold mb-4 border-b border-white/20 pb-2">Golden Ratio Check</h3>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Even vs Odd */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-orange-200">Even vs. Odd</h4>
                    <ul className="text-sm space-y-1">
                      <li><span className="opacity-70">Even sum:</span> {g3Sums.even}</li>
                      <li><span className="opacity-70">Odd sum:</span> {g3Sums.odd}</li>
                      {evenOddStats.valid ? (
                        <>
                          <li><span className="opacity-70">Even / Odd:</span> {(g3Sums.even / g3Sums.odd).toFixed(4)}</li>
                          <li><span className="opacity-70">Odd / Even:</span> {(g3Sums.odd / g3Sums.even).toFixed(4)}</li>
                          <li><span className="opacity-70">Closest ratio to φ:</span> {evenOddStats.ratio.toFixed(4)}</li>
                          <li><span className="opacity-70">Difference from φ:</span> {evenOddStats.difference.toFixed(4)}</li>
                          <li className={`font-bold mt-2 ${evenOddStats.isClose ? 'text-green-400' : 'text-red-400'}`}>
                            {evenOddStats.isClose ? "Close to the Golden Ratio" : "Not close to the Golden Ratio"}
                          </li>
                        </>
                      ) : (
                        <li className="text-red-400 font-bold">Invalid Ratio</li>
                      )}
                    </ul>
                  </div>

                  {/* Repeated vs Non-Repeated */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-orange-200">Repeated vs. Non-Repeated</h4>
                    <ul className="text-sm space-y-1">
                      <li><span className="opacity-70">Repeated sum:</span> {g3Sums.repeated}</li>
                      <li><span className="opacity-70">Non-repeated sum:</span> {g3Sums.nonRepeated}</li>
                      {repStats.valid ? (
                        <>
                          <li><span className="opacity-70">Repeated / Non-Repeated:</span> {(g3Sums.repeated / g3Sums.nonRepeated).toFixed(4)}</li>
                          <li><span className="opacity-70">Non-repeated / Repeated:</span> {(g3Sums.nonRepeated / g3Sums.repeated).toFixed(4)}</li>
                          <li><span className="opacity-70">Closest ratio to φ:</span> {repStats.ratio.toFixed(4)}</li>
                          <li><span className="opacity-70">Difference from φ:</span> {repStats.difference.toFixed(4)}</li>
                          <li className={`font-bold mt-2 ${repStats.isClose ? 'text-green-400' : 'text-red-400'}`}>
                            {repStats.isClose ? "Close to the Golden Ratio" : "Not close to the Golden Ratio"}
                          </li>
                        </>
                      ) : (
                        <li className="text-red-400 font-bold">Invalid Ratio</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <button
                onClick={generateGame3}
                className="px-6 py-3 bg-white text-orange-700 rounded-xl font-bold shadow-lg hover:bg-orange-50 hover:scale-105 active:scale-95 transition flex items-center gap-2"
              >
                <Play className="w-5 h-5" />
                Generate Level {g3LevelIdx + 1} ({LEVELS[g3LevelIdx].count} Surahs)
              </button>
            </div>
            {g3Status !== 'idle' && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => {
                    if (g3LevelIdx < LEVELS.length - 1) {
                      setG3LevelIdx(prev => prev + 1);
                      setG3Status('idle');
                      setG3Data([]);
                    } else {
                      resetGame3();
                    }
                  }}
                  className="px-6 py-2 bg-orange-800 text-white rounded-lg font-bold shadow hover:bg-orange-900 active:scale-95 transition"
                >
                  {g3LevelIdx < LEVELS.length - 1 ? `Next Level (${g3LevelIdx + 2}/${LEVELS.length})` : 'Restart Game 3'}
                </button>
              </div>
            )}
          </div>

          {/* Batch Mode Panel */}
          <div className="bg-slate-50 border-t border-slate-200 p-6">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-800">Batch Automation</h3>
                  <p className="text-xs text-slate-500">Run thousands of randomized iterations instantly.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-600">Batches:</span>
                  <select
                    value={g3BatchSize}
                    onChange={(e) => setG3BatchSize(Number(e.target.value))}
                    className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value={10}>10</option>
                    <option value={100}>100</option>
                    <option value={1000}>1,000</option>
                    <option value={10000}>10,000</option>
                    <option value={100000}>100,000</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                  <button
                    onClick={() => runBatchGame3()}
                    className="flex-1 py-2.5 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-700 active:scale-[0.98] transition flex items-center justify-center gap-2"
                    disabled={isG3AutoRunning}
                  >
                    <RotateCcw className="w-4 h-4" />
                    Run {g3BatchSize.toLocaleString()} Iterations
                  </button>
                  <button
                    onClick={() => setIsG3AutoRunning(!isG3AutoRunning)}
                    className={`flex-1 py-2.5 text-white rounded-lg font-bold active:scale-[0.98] transition flex items-center justify-center gap-2 ${
                      isG3AutoRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    <Play className="w-4 h-4" />
                    {isG3AutoRunning ? 'Stop Infinite' : 'Start Infinite (100k)'}
                  </button>
                </div>
                {(g3Attempts > 0 || g3Wins > 0 || g3Losses > 0) && (
                  <div className="flex justify-center">
                    <button
                      onClick={resetGame3}
                      className="px-4 py-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-lg font-medium transition w-full"
                    >
                      Reset Stats
                    </button>
                  </div>
                )}
              </div>

              {/* Batch Stats */}
              {(g3Attempts > 0 || g3Wins > 0 || g3Losses > 0) && (
                <>
                  <div className="mt-6 grid grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Total Runs</div>
                      <div className="text-xl font-mono font-bold text-slate-800">{g3Attempts.toLocaleString()}</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-xl border border-green-200 shadow-sm text-center">
                      <div className="text-[10px] uppercase tracking-wider text-green-600 font-bold mb-1">Successes</div>
                      <div className="text-xl font-mono font-bold text-green-700">{g3Wins.toLocaleString()}</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-xl border border-red-200 shadow-sm text-center">
                      <div className="text-[10px] uppercase tracking-wider text-red-600 font-bold mb-1">Failures</div>
                      <div className="text-xl font-mono font-bold text-red-700">{g3Losses.toLocaleString()}</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Win Rate</div>
                      <div className="text-xl font-mono font-bold text-slate-800">
                        {g3Attempts > 0 ? ((g3Wins / g3Attempts) * 100).toFixed(4) : '0'}%
                      </div>
                    </div>
                  </div>
                  <div className="text-center mt-4">
                    <button
                      onClick={() => {
                        const csvHeader = "Batch,Repeated_A,NonRepeated_B,Ratio,Success\n";
                        const csvContent = g3BatchResults.map((r, i) => `${i + 1},${r.A},${r.B},${r.ratio.toFixed(3)},${r.success}`).join("\n");
                        const blob = new Blob([csvHeader + csvContent], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'batch_results_game3.csv';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                      className="text-orange-600 hover:text-orange-800 text-sm font-medium underline"
                    >
                      Export Full Batch Results (CSV)
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Detailed Data */}
          {g3Data.length > 0 && (
            <div className="p-6 bg-slate-50 border-t border-slate-200 max-h-96 overflow-y-auto">
              <h3 className="font-bold text-slate-800 mb-4 text-center">Level {g3LevelIdx + 1} Codes</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {g3Data.map((d) => (
                  <div key={d.id} className={`p-2 rounded border text-center text-xs ${d.isRepeated ? 'bg-orange-100 border-orange-300' : 'bg-white border-slate-200'}`}>
                    <div className="text-slate-500">S:{d.id} A:{d.ayahs}</div>
                    <div className={`font-bold ${d.isRepeated ? 'text-orange-700' : 'text-slate-700'}`}>
                      Code: {d.code}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

const renderGame2 = () => (
    <div className="space-y-8">
      {renderBackButton()}

      {/* Level Selector */}
      <div className="flex flex-wrap gap-4 justify-center">
        {LEVELS.map((lvl, idx) => (
          <button
            key={lvl.id}
            onClick={() => setG2LevelIdx(idx)}
            className={`relative flex flex-col items-center p-4 rounded-xl border-2 w-40 transition-all
              ${g2LevelIdx === idx
                ? 'border-violet-600 bg-violet-50 scale-105 shadow-md'
                : 'border-slate-200 bg-white hover:border-violet-300 text-slate-400 hover:text-slate-600'}`}
          >
            <span className="text-sm uppercase font-bold tracking-wider mb-1">Level {lvl.id}</span>
            <span className="text-2xl font-black">{lvl.count}</span>
            <span className="text-xs">Surahs</span>
          </button>
        ))}
      </div>

      {/* Game Board */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        <div className="p-8 text-center bg-gradient-to-br from-violet-900 to-purple-900 text-white">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white bg-white/20 mb-4">
            <Scissors className="w-3 h-3" />
            Game 2
          </div>
          <h2 className="text-2xl font-bold mb-2">Halving Symmetry</h2>
          <p className="text-purple-200 max-w-2xl mx-auto text-sm">
            Generate random ayah counts for {g2Count} surahs. Split them in half (1–{g2Half} & {g2Half + 1}–{g2Count}) and check if the number of surahs with <strong>even</strong> ayah counts is the same in both halves.
          </p>

          {/* Scoreboard */}
          <div className="mt-8 flex justify-center items-center gap-8">
            <div className="text-center">
              <div className="text-xs uppercase tracking-widest text-purple-300 mb-1">First Half (1–{g2Half})</div>
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
              <div className="text-xs uppercase tracking-widest text-purple-300 mb-1">Second Half ({g2Half + 1}–{g2Count})</div>
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
              <p>Press Generate to create random ayah counts for {g2Count} Surahs</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {/* First Half */}
              <div>
                <h4 className="text-sm font-bold text-slate-600 mb-3 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-violet-500"></div>
                  First Half — Surahs 1–{g2Half}
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
                  Second Half — Surahs {g2Half + 1}–{g2Count}
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
            <p>The real Quran has 114 surahs. If you split them in half (surahs 1–57 and 58–114), each half has exactly the same number of surahs with an <strong>even</strong> number of ayahs.</p>
          </li>
          <li className="flex gap-3">
            <div className="bg-slate-100 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0">2</div>
            <p>In this simulation, we assign <strong>random</strong> ayah counts to {g2Count} surahs and check whether this symmetry occurs.</p>
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


  const renderGame4 = () => {
    const winRate = g4Attempts > 0 ? ((g4Wins / g4Attempts) * 100).toFixed(6) : "0.000000";

    return (
      <div className="space-y-8">
        {renderBackButton()}

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-8 text-center relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-center space-x-3 mb-4 opacity-90">
                <Dices className="w-6 h-6 text-white" />
                <span className="text-white font-medium tracking-wider uppercase text-sm">Game 4</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 drop-shadow-md">
                The Primes Miracle
              </h1>
              <p className="text-blue-100 max-w-2xl mx-auto text-lg leading-relaxed">
                Generate random ayah counts. For each prime ayah count, find its corresponding nth prime.
                Win if the sum of prime ayah counts (m) plus the sum of nth primes (pm) equals the total number of ayahs generated.
              </p>

              {/* Level Selector */}
              <div className="flex flex-wrap justify-center gap-3 mt-8">
                {LEVELS.map((level, idx) => (
                  <button
                    key={level.id}
                    onClick={() => setG4LevelIdx(idx)}
                    className={`px-5 py-2 rounded-full font-bold text-sm transition-all duration-300 relative
                      ${g4LevelIdx === idx
                        ? 'bg-white text-indigo-700 shadow-lg scale-105 ring-2 ring-white/50'
                        : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                      }`}
                  >
                    Level {idx + 1}: {level.count} Surahs
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => { generateGame4(); }}
                className="flex items-center justify-center space-x-2 px-8 py-4 bg-white border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-slate-700 font-bold rounded-xl transition-all w-full sm:w-auto shadow-sm"
              >
                <Play className="w-5 h-5 text-blue-500" />
                <span>Generate Single Run</span>
              </button>
            </div>

            {/* Batch execution */}
            <div className="mt-8 bg-slate-50 rounded-xl p-6 border border-slate-100">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="font-bold text-slate-800 flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-indigo-500" />
                    <span>Batch Automation</span>
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">Run thousands of randomized iterations instantly.</p>
                </div>

                <div className="flex items-center space-x-4 w-full md:w-auto">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-slate-600">Batches:</label>
                    <select
                      value={g4BatchSize}
                      onChange={(e) => setG4BatchSize(Number(e.target.value))}
                      className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value={10}>10</option>
                      <option value={100}>100</option>
                      <option value={1000}>1,000</option>
                      <option value={10000}>10,000</option>
                    </select>
                  </div>
                  <button
                    onClick={() => runBatchGame4()}
                    className="flex items-center justify-center space-x-2 px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg transition-colors flex-1 md:flex-none shadow-md"
                    disabled={isG4AutoRunning}
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Run {g4BatchSize.toLocaleString()}</span>
                  </button>
                  <button
                    onClick={() => setIsG4AutoRunning(!isG4AutoRunning)}
                    className={`flex items-center justify-center space-x-2 px-6 py-2 text-white font-medium rounded-lg transition-colors flex-1 md:flex-none shadow-md ${
                      isG4AutoRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    <Play className="w-4 h-4" />
                    <span>{isG4AutoRunning ? 'Stop Infinite' : 'Start Infinite (100k)'}</span>
                  </button>
                </div>
                {(g4Attempts > 0) && (
                  <div className="flex justify-center mt-4">
                    <button
                      onClick={resetGame4}
                      className="text-slate-500 hover:text-slate-700 font-medium text-sm flex items-center gap-1"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset Stats
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 text-center">
            <p className="text-sm text-slate-500 uppercase tracking-wider mb-2 font-medium">Total Attempts</p>
            <p className="text-3xl font-black text-slate-800">{g4Attempts.toLocaleString()}</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-6 shadow-sm border border-emerald-100 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-20">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            </div>
            <p className="text-sm text-emerald-600 uppercase tracking-wider mb-2 font-bold">Miracles Found</p>
            <p className="text-3xl font-black text-emerald-600 relative z-10">{g4Wins.toLocaleString()}</p>
          </div>
          <div className="bg-rose-50 rounded-xl p-6 shadow-sm border border-rose-100 text-center">
            <p className="text-sm text-rose-600 uppercase tracking-wider mb-2 font-bold">Failed Attempts</p>
            <p className="text-3xl font-black text-rose-600">{g4Losses.toLocaleString()}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-6 shadow-sm border border-blue-100 text-center">
            <p className="text-sm text-blue-600 uppercase tracking-wider mb-2 font-bold">Success Rate</p>
            <p className="text-3xl font-black text-blue-600">{winRate}%</p>
          </div>
        </div>

        {/* Current Result */}
        {g4Data.length > 0 && (
          <div className={`rounded-xl p-6 border-2 transition-all duration-500 ${
            g4Status === 'success' ? 'bg-emerald-50 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'bg-rose-50 border-rose-200'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`font-bold text-lg flex items-center space-x-2 ${g4Status === 'success' ? 'text-emerald-700' : 'text-rose-700'}`}>
                {g4Status === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                <span>{g4Status === 'success' ? 'Miracle Verified!' : 'Miracle Not Found'}</span>
              </h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-xs text-slate-500 uppercase font-medium mb-1">Total Ayahs</p>
                <p className="text-2xl font-bold text-slate-800">{g4Data.reduce((acc, curr) => acc + curr.ayahs, 0)}</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-xs text-slate-500 uppercase font-medium mb-1">Sum of Prime Ayahs (m)</p>
                <p className="text-2xl font-bold text-slate-800">
                  {g4Data.filter(d => d.isPrimeAyahs).reduce((acc, curr) => acc + curr.ayahs, 0)}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-xs text-slate-500 uppercase font-medium mb-1">Sum of nth Primes (pm)</p>
                <p className="text-2xl font-bold text-slate-800">
                  {g4Data.filter(d => d.isPrimeAyahs).reduce((acc, curr) => acc + curr.nthPrime, 0)}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border-2 border-indigo-100">
                <p className="text-xs text-indigo-500 uppercase font-bold mb-1">Total m + pm</p>
                <p className="text-2xl font-black text-indigo-700">
                  {g4Data.filter(d => d.isPrimeAyahs).reduce((acc, curr) => acc + curr.ayahs + curr.nthPrime, 0)}
                </p>
              </div>
            </div>

            {/* Sub Tables */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Primes Table */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col max-h-96">
                <div className="bg-indigo-50 p-3 border-b border-indigo-100 font-bold text-indigo-800 text-center sticky top-0">
                  Primes (m)
                </div>
                <div className="overflow-y-auto flex-1">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="py-2 px-3 text-left text-slate-500 font-medium">Surah</th>
                        <th className="py-2 px-3 text-right text-slate-500 font-medium">Ayahs</th>
                        <th className="py-2 px-3 text-right text-slate-500 font-medium">nth</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {g4Data.filter(d => d.isPrimeAyahs).map(d => (
                        <tr key={`p-${d.id}`} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2 px-3 font-medium text-slate-700">{d.id}</td>
                          <td className="py-2 px-3 text-right text-indigo-600 font-bold">{d.ayahs}</td>
                          <td className="py-2 px-3 text-right text-indigo-400">{d.nthPrime}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Non-Primes Table */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col max-h-96">
                <div className="bg-slate-50 p-3 border-b border-slate-200 font-bold text-slate-700 text-center sticky top-0">
                  Non-Primes
                </div>
                <div className="overflow-y-auto flex-1">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="py-2 px-3 text-left text-slate-500 font-medium">Surah</th>
                        <th className="py-2 px-3 text-right text-slate-500 font-medium">Ayahs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {g4Data.filter(d => !d.isPrimeAyahs).map(d => (
                        <tr key={`np-${d.id}`} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2 px-3 font-medium text-slate-700">{d.id}</td>
                          <td className="py-2 px-3 text-right text-slate-600">{d.ayahs}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Original Table */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col max-h-96">
                <div className="bg-slate-800 p-3 border-b border-slate-700 font-bold text-white text-center sticky top-0">
                  Original (All)
                </div>
                <div className="overflow-y-auto flex-1">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="py-2 px-3 text-left text-slate-500 font-medium">Surah</th>
                        <th className="py-2 px-3 text-right text-slate-500 font-medium">Ayahs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {g4Data.map(d => (
                        <tr key={`o-${d.id}`} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2 px-3 font-medium text-slate-700">{d.id}</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-800">{d.ayahs}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    );
  };

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
            selectedGame === 'game2' ? renderGame2() :
            selectedGame === 'game3' ? renderGame3() :
              renderGame4()
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
