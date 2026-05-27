"use client";

import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { Navbar } from "../components/Navbar/Navbar";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

type Survey = {
  surveyId: number;
  typeOrTeacher: string;
  targetClass: string;
  startDate: string;
  endDate: string;
};

export default function DashboardPage() {
  const { accounts, instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const router = useRouter();

  const [accessCode, setAccessCode] = useState<string>("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [className, setClassName] = useState<string | null>(null);
  const [activeSurveys, setActiveSurveys] = useState<Survey[]>([]);
  const [completedSurveys, setCompletedSurveys] = useState<number[]>([]);
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const getAccessToken = useCallback(async () => {
    if (accounts.length === 0) return null;
    try {
      const response = await instance.acquireTokenSilent({
        scopes: ["api://d5614add-3e17-42b6-a294-fc218d0f61e6/access_as_user"],
        account: accounts[0],
      });
      return response.accessToken;
    } catch (e) {
      console.error("Błąd pobierania tokena", e);
      return null;
    }
  }, [instance, accounts]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const checkStatuses = async () => {
      if (activeSurveys.length === 0) return;
      setIsLoadingStatuses(true);
      const token = await getAccessToken();
      if (!token) {
        setIsLoadingStatuses(false);
        return;
      }
      const promises = activeSurveys.map(async (s) => {
        try {
          const res = await fetch(
            `http://localhost:8080/api/surveys/${s.surveyId}/is-completed`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          return res.ok && (await res.json()) ? s.surveyId : null;
        } catch {
          return null;
        }
      });
      const results = (await Promise.all(promises)).filter(
        (id): id is number => id !== null
      );
      setCompletedSurveys(results);
      setIsLoadingStatuses(false);
    };
    checkStatuses();
  }, [activeSurveys, getAccessToken]);

  const handleSearch = async () => {
    if (!accessCode.trim()) return;
    setCodeError(null);
    setIsSearching(true);
    try {
      const res = await fetch(
        `http://localhost:8080/api/admin/surveys/active/by-code/${accessCode.trim().toUpperCase()}`
      );
      if (!res.ok) {
        setCodeError("Nie znaleziono klasy o tym kodzie. Sprawdź kod i spróbuj ponownie.");
        setActiveSurveys([]);
        setClassName(null);
        setIsSearching(false);
        return;
      }
      const surveys: Survey[] = await res.json();
      setActiveSurveys(surveys);
      setClassName(surveys.length > 0 ? surveys[0].targetClass : accessCode);
    } catch {
      setCodeError("Błąd połączenia z serwerem.");
    }
    setIsSearching(false);
  };

  const sortedSurveys = [...activeSurveys].sort((a, b) =>
    a.typeOrTeacher.localeCompare(b.typeOrTeacher, "pl")
  );

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      <main className="flex flex-col items-center pt-32 pb-12 px-6">
        <div className="w-full max-w-2xl p-8 bg-white rounded-2xl shadow-xl border border-zinc-200">
          <h1 className="text-2xl font-black mb-6 text-center">
            Witaj, {accounts[0]?.name}!
          </h1>

          <div className="mb-8">
            <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">
              Wpisz kod swojej klasy:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={accessCode}
                onChange={(e) => {
                  setAccessCode(e.target.value.toUpperCase());
                  setCodeError(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="np. 2TPTAU-A3F1"
                className="flex-1 px-4 py-3 bg-zinc-50 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono tracking-widest"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching || !accessCode.trim()}
                className="px-5 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {isSearching ? "..." : "Szukaj"}
              </button>
            </div>
            {codeError && (
              <p className="text-red-500 text-xs mt-2 font-medium">{codeError}</p>
            )}
          </div>

          {className !== null && (
            <div className="border-t pt-8">
              <h2 className="font-bold text-lg mb-4 text-zinc-800">
                Ankiety dla klasy {className}:
              </h2>
              {isLoadingStatuses ? (
                <p className="text-zinc-400 text-sm italic">
                  Sprawdzanie statusu ankiet...
                </p>
              ) : sortedSurveys.length > 0 ? (
                <div className="grid gap-4">
                  {sortedSurveys.map((s) => {
                    const isCompleted = completedSurveys.includes(s.surveyId);
                    return (
                      <div
                        key={s.surveyId}
                        className="flex justify-between items-center p-4 bg-zinc-50 rounded-xl border border-zinc-200"
                      >
                        <div>
                          <p className="font-bold text-sm text-zinc-800">
                            {s.typeOrTeacher}
                          </p>
                          <p className="text-[10px] text-zinc-400 font-bold uppercase">
                            {s.startDate} - {s.endDate}
                          </p>
                        </div>
                        {isCompleted ? (
                          <div className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold border border-emerald-200">
                            ✓ Wysłano
                          </div>
                        ) : (
                          <a
                            href={`/survey/${s.surveyId}`}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors"
                          >
                            Wypełnij
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-zinc-500 italic text-sm">
                  Brak aktywnych ankiet dla tej klasy.
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
