import sys

with open("src/Miracle.tsx", "r") as f:
    content = f.read()

# 1. State Replacement
start_state = "  // --- Game 1 State ---"
end_state = "  // --- Game 2 State ---"
s_state = content.find(start_state)
e_state = content.find(end_state)
if s_state == -1 or e_state == -1:
    print("State markers missing")
    sys.exit(1)

new_state = """  // --- Game 1 State ---
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [attempts, setAttempts] = useState(0);

  const [table1Data, setTable1Data] = useState<Array<{ id: number, ayahs: number, sum: number, isEvenAyahs: boolean, isEvenSum: boolean }>>([]);
  const [table2Data, setTable2Data] = useState<Array<{ id: number, words: number, sum: number, isEvenWords: boolean, isEvenSum: boolean }>>([]);

  const [table1Win, setTable1Win] = useState(false);
  const [table2Win, setTable2Win] = useState(false);

  const [stats, setStats] = useState({ table1Rate: 0, table2Rate: 0, combinedRate: 0 });

"""
content = content[:s_state] + new_state + content[e_state:]

# 2. Logic Replacement
start_logic = "  const generateRandom = () => {"
end_logic = "  // --- Game 2 Logic ---"
s_logic = content.find(start_logic)
e_logic = content.find(end_logic)
if s_logic == -1 or e_logic == -1:
    print("Logic markers missing")
    sys.exit(1)

# Find the end of generateRandom which is before sums = useMemo...
end_logic_real = content.rfind("  };", s_logic, e_logic) + 4
end_sums = content.find("  }, [surahData]);", end_logic_real) + 18
if end_sums != 17: # meaning found
    end_logic_real = end_sums

new_logic = """  const calculateProbabilities = (n: number) => {
    // Run a quick simulation to estimate probabilities
    const iterations = 10000;
    let t1Wins = 0;
    let t2Wins = 0;
    let bothWins = 0;
    const target = n / 2;

    for (let i = 0; i < iterations; i++) {
      let t1AyahsEven = 0, t1SumEven = 0;
      let t2WordsEven = 0, t2SumEven = 0;

      for (let j = 1; j <= n; j++) {
        const a = Math.floor(Math.random() * 284) + 3;
        const w = Math.floor(Math.random() * (n * 100)) + 1;

        if (a % 2 === 0) t1AyahsEven++;
        if ((j + a) % 2 === 0) t1SumEven++;

        if (w % 2 === 0) t2WordsEven++;
        if ((j + w) % 2 === 0) t2SumEven++;
      }

      const t1Win = t1AyahsEven === target || t1SumEven === target;
      const t2Win = t2WordsEven === target || t2SumEven === target;

      if (t1Win) t1Wins++;
      if (t2Win) t2Wins++;
      if (t1Win && t2Win) bothWins++;
    }

    return {
      table1Rate: (t1Wins / iterations) * 100,
      table2Rate: (t2Wins / iterations) * 100,
      combinedRate: (bothWins / iterations) * 100
    };
  };

  useEffect(() => {
    // Calculate initial stats when level changes
    setStats(calculateProbabilities(LEVELS[currentLevelIdx].count));
  }, [currentLevelIdx]);

  const generateRandom = () => {
    setAttempts(prev => prev + 1);
    const n = LEVELS[currentLevelIdx].count;

    const newTable1 = Array.from({ length: n }, (_, i) => {
      const id = i + 1;
      const ayahs = Math.floor(Math.random() * 284) + 3;
      const sum = id + ayahs;
      return { id, ayahs, sum, isEvenAyahs: ayahs % 2 === 0, isEvenSum: sum % 2 === 0 };
    });

    const newTable2 = Array.from({ length: n }, (_, i) => {
      const id = i + 1;
      const words = Math.floor(Math.random() * (n * 100)) + 1;
      const sum = id + words;
      return { id, words, sum, isEvenWords: words % 2 === 0, isEvenSum: sum % 2 === 0 };
    });

    setTable1Data(newTable1);
    setTable2Data(newTable2);

    const target = n / 2;

    const t1AyahsEvenCount = newTable1.filter(d => d.isEvenAyahs).length;
    const t1SumEvenCount = newTable1.filter(d => d.isEvenSum).length;
    const isT1Win = t1AyahsEvenCount === target || t1SumEvenCount === target;

    const t2WordsEvenCount = newTable2.filter(d => d.isEvenWords).length;
    const t2SumEvenCount = newTable2.filter(d => d.isEvenSum).length;
    const isT2Win = t2WordsEvenCount === target || t2SumEvenCount === target;

    setTable1Win(isT1Win);
    setTable2Win(isT2Win);
  };
"""
content = content[:s_logic] + new_logic + "\n" + content[end_logic_real:]

# 3. UI Replacement
start_ui = "{/* Game Board */}"
end_ui = "{/* Explanation Block */}"
s_ui = content.find(start_ui)
e_ui = content.find(end_ui)
if s_ui == -1 or e_ui == -1:
    print("UI markers missing")
    sys.exit(1)

new_ui = """{/* Game Board */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        <div className="p-8 text-center bg-slate-900 text-white">
          <h2 className="text-2xl font-bold mb-2">{LEVELS[currentLevelIdx].name}</h2>
          <p className="text-slate-300 max-w-2xl mx-auto">{LEVELS[currentLevelIdx].description}</p>

          <div className="mt-6 flex flex-col md:flex-row items-center justify-center gap-6">
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center">
              <div className="text-xs uppercase tracking-widest text-slate-400 mb-1">Target Split</div>
              <div className="text-2xl font-mono font-bold text-white">
                {LEVELS[currentLevelIdx].count / 2} / {LEVELS[currentLevelIdx].count / 2}
              </div>
            </div>
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center text-sm">
              <div className="text-xs uppercase text-slate-400 mb-1">Estimated Probabilities</div>
              <div className="flex gap-4 font-mono text-emerald-400">
                <span>T1: {stats.table1Rate.toFixed(1)}%</span>
                <span>T2: {stats.table2Rate.toFixed(1)}%</span>
                <span className="text-yellow-400">Both: {stats.combinedRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={generateRandom}
              className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-emerald-600 font-lg rounded-full hover:bg-emerald-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600"
            >
              <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              Generate Random Tables
            </button>
            <p className="mt-4 text-xs text-slate-500">Attempt #{attempts}</p>
          </div>
        </div>

        {/* Status Message */}
        {(attempts > 0) && (
          <div className={`p-4 text-center border-b ${table1Win && table2Win ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : (table1Win || table2Win) ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
            <div className="flex items-center justify-center gap-2 font-bold">
              {table1Win && table2Win ? <CheckCircle2 className="w-6 h-6" /> : (table1Win || table2Win) ? <Info className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
              <span>
                {table1Win && table2Win ? "SUBHANALLAH! Both Tables achieved perfect symmetry simultaneously!" : (table1Win || table2Win) ? "Partial Match! One of the tables achieved perfect symmetry." : "Imbalance Detected. Neither table reached perfect symmetry."}
              </span>
            </div>
          </div>
        )}

        {/* Visualization Grid */}
        <div className="p-6 bg-slate-50">
          {table1Data.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-slate-400 py-12">
              <RotateCcw className="w-12 h-12 mb-4 opacity-20" />
              <p>Press Generate to create random sets of Ayahs and Words</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {/* Table 1 */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg text-slate-700">Table 1: Ayahs</h3>
                  <div className={`px-3 py-1 text-xs font-bold rounded-full ${table1Win ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {table1Win ? 'SUCCESS' : 'FAIL'}
                  </div>
                </div>
                <div className="flex gap-4 mb-4 text-sm text-slate-600 bg-white p-3 rounded-lg border border-slate-200">
                  <div className="flex-1">
                    <span className="block text-xs uppercase text-slate-400">Ayahs Split</span>
                    <span className="font-bold">{table1Data.filter(d => d.isEvenAyahs).length}E / {table1Data.filter(d => !d.isEvenAyahs).length}O</span>
                  </div>
                  <div className="w-px bg-slate-200"></div>
                  <div className="flex-1">
                    <span className="block text-xs uppercase text-slate-400">Sum Split</span>
                    <span className="font-bold">{table1Data.filter(d => d.isEvenSum).length}E / {table1Data.filter(d => !d.isEvenSum).length}O</span>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto rounded-xl border border-slate-200 shadow-inner">
                  <table className="w-full text-xs text-left bg-white">
                    <thead className="bg-slate-100 sticky top-0">
                      <tr>
                        <th className="p-2 font-semibold">Surah</th>
                        <th className="p-2 font-semibold text-right">Ayahs</th>
                        <th className="p-2 font-semibold text-right">Sum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {table1Data.map(d => (
                        <tr key={d.id} className="hover:bg-slate-50">
                          <td className="p-2 font-medium">#{d.id}</td>
                          <td className={`p-2 text-right ${d.isEvenAyahs ? 'text-blue-600' : 'text-orange-600'}`}>{d.ayahs}</td>
                          <td className={`p-2 text-right font-bold ${d.isEvenSum ? 'text-blue-600' : 'text-orange-600'}`}>{d.sum}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Table 2 */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg text-slate-700">Table 2: Words</h3>
                  <div className={`px-3 py-1 text-xs font-bold rounded-full ${table2Win ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {table2Win ? 'SUCCESS' : 'FAIL'}
                  </div>
                </div>
                <div className="flex gap-4 mb-4 text-sm text-slate-600 bg-white p-3 rounded-lg border border-slate-200">
                  <div className="flex-1">
                    <span className="block text-xs uppercase text-slate-400">Words Split</span>
                    <span className="font-bold">{table2Data.filter(d => d.isEvenWords).length}E / {table2Data.filter(d => !d.isEvenWords).length}O</span>
                  </div>
                  <div className="w-px bg-slate-200"></div>
                  <div className="flex-1">
                    <span className="block text-xs uppercase text-slate-400">Sum Split</span>
                    <span className="font-bold">{table2Data.filter(d => d.isEvenSum).length}E / {table2Data.filter(d => !d.isEvenSum).length}O</span>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto rounded-xl border border-slate-200 shadow-inner">
                  <table className="w-full text-xs text-left bg-white">
                    <thead className="bg-slate-100 sticky top-0">
                      <tr>
                        <th className="p-2 font-semibold">Surah</th>
                        <th className="p-2 font-semibold text-right">Words</th>
                        <th className="p-2 font-semibold text-right">Sum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {table2Data.map(d => (
                        <tr key={d.id} className="hover:bg-slate-50">
                          <td className="p-2 font-medium">#{d.id}</td>
                          <td className={`p-2 text-right ${d.isEvenWords ? 'text-purple-600' : 'text-pink-600'}`}>{d.words}</td>
                          <td className={`p-2 text-right font-bold ${d.isEvenSum ? 'text-purple-600' : 'text-pink-600'}`}>{d.sum}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      """

content = content[:s_ui] + new_ui + content[e_ui:]

with open("src/Miracle.tsx", "w") as f:
    f.write(content)
