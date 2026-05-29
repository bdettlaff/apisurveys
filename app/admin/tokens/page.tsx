"use client";

import { useEffect, useState } from "react";
import { Navbar } from "../../components/Navbar/Navbar";

type Survey = { id: number; title: string };
type Classes = { id: number; name: string };
type Token = {
  id: number;
  token: string;
  user: { id: number; login: string };
  isUsed: boolean;
};

export default function TokensPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [classes, setClasses] = useState<Classes[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:8080/api/surveys")
      .then((r) => r.json())
      .then(setSurveys)
      .catch(() => {});
    fetch("http://localhost:8080/api/classes")
      .then((r) => r.json())
      .then(setClasses)
      .catch(() => {});
  }, []);

  const handleGenerate = async () => {
    if (!selectedSurvey || !selectedClass) {
      alert("Wybierz ankietę i klasę!");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/tokens/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          surveyId: Number(selectedSurvey),
          classId: Number(selectedClass),
        }),
      });
      const data = await res.json();
      setTokens(data);
    } catch {
      alert("Błąd podczas generowania tokenów!");
    }
    setLoading(false);
  };

  const handleLoadExisting = async () => {
    if (!selectedSurvey) {
      alert("Wybierz ankietę!");
      return;
    }
    const res = await fetch(
      `http://localhost:8080/api/tokens/survey/${selectedSurvey}`,
    );
    const data = await res.json();
    setTokens(data);
  };

  const copyLink = (token: string) => {
    const link = `${window.location.origin}/survey?token=${token}`;
    navigator.clipboard.writeText(link);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-50 antialiased text-zinc-900 selection:bg-zinc-200">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 pt-32 pb-16">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight uppercase text-zinc-900">
              Tokeny Ankiet
            </h1>
            <p className="text-xs font-bold text-zinc-400 tracking-wider uppercase mt-1">
              Generowanie linków dla uczniów do wypełnienia ankiety
            </p>
          </div>
        </div>

        {/* Formularz */}
        <div className="bg-white border border-zinc-200/60 rounded-2xl p-5 md:p-6 shadow-sm mb-6">
          <h2 className="text-xs font-black tracking-wider text-zinc-400 uppercase mb-4">
            Wybierz ankietę i klasę
          </h2>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <select
                value={selectedSurvey}
                onChange={(e) => setSelectedSurvey(e.target.value)}
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-800 transition-all font-medium text-zinc-800 appearance-none cursor-pointer shadow-sm"
              >
                <option value="">-- Wybierz ankietę --</option>
                {surveys.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-zinc-400">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </div>
            </div>

            <div className="relative flex-1">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-800 transition-all font-medium text-zinc-800 appearance-none cursor-pointer shadow-sm"
              >
                <option value="">-- Wybierz klasę --</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-zinc-400">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-5 py-3 bg-zinc-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {loading ? "Generowanie..." : "Generuj tokeny"}
            </button>
            <button
              onClick={handleLoadExisting}
              className="px-5 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold uppercase tracking-wider rounded-xl transition-all active:scale-95"
            >
              Pokaż istniejące
            </button>
          </div>
        </div>

        {/* Lista tokenów */}
        {tokens.length > 0 && (
          <div className="bg-white border border-zinc-200/60 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100">
              <h2 className="text-xs font-black tracking-wider text-zinc-400 uppercase">
                Wygenerowane linki ({tokens.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-100">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Uczeń
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Status
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Token
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500 text-right">
                      Akcja
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-medium text-zinc-800">
                  {tokens.map((t) => (
                    <tr
                      key={t.id}
                      className="hover:bg-zinc-50/60 transition-colors"
                    >
                      <td className="px-6 py-4 text-zinc-800">
                        {t.user.login}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide ${
                            t.isUsed
                              ? "bg-red-50 border border-red-100 text-red-600"
                              : "bg-green-50 border border-green-100 text-green-600"
                          }`}
                        >
                          {t.isUsed ? "Użyty" : "Aktywny"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-400 font-mono text-xs">
                        {t.token.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => copyLink(t.token)}
                          className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all active:scale-95 ${
                            copied === t.token
                              ? "bg-green-50 border border-green-100 text-green-600"
                              : "border border-zinc-200 hover:bg-zinc-50 text-zinc-700"
                          }`}
                        >
                          {copied === t.token ? "Skopiowano!" : "Kopiuj link"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tokens.length === 0 && (
          <div className="text-center py-12 text-zinc-400 font-medium">
            Wybierz ankietę i klasę, a następnie wygeneruj tokeny.
          </div>
        )}
      </main>
    </div>
  );
}
