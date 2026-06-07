"use client";

import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { Navbar } from "../components/Navbar/Navbar";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { API_URL } from '@/lib/api'

type Survey = {
  surveyId: number;
  typeOrTeacher: string;
  targetClass: string;
  startDate: string;
  endDate: string;
  isSchoolSurvey: boolean;
};

type TokenInfo = {
  firstUsedAt: string;
  expiresAt: string;
  expired: boolean;
};

type TeacherGroup = {
  teacherName: string;
  subjects: string[];
  surveyIds: number[];
  startDate: string;
  endDate: string;
  isSchoolSurvey: boolean;
};

function TokenCountdown({ tokenInfo }: { tokenInfo: TokenInfo }) {
  const [secondsLeft, setSecondsLeft] = useState<number>(() =>
    Math.max(
      0,
      Math.floor((new Date(tokenInfo.expiresAt).getTime() - Date.now()) / 1000),
    ),
  );

  useEffect(() => {
    if (tokenInfo.expired || secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [tokenInfo.expired]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isExpired = tokenInfo.expired || secondsLeft === 0;
  const isWarning = !isExpired && secondsLeft < 300;

  if (isExpired) {
    return (
      <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
        <span className="text-amber-500 text-sm">⚠</span>
        <p className="text-xs font-semibold text-amber-700">
          Sesja wygasła — możesz dokończyć wypełnianie, ale nie możesz wejść
          ponownie tym kodem.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`mb-6 p-3 rounded-xl border flex items-center justify-between ${
        isWarning
          ? "bg-amber-50 border-amber-200"
          : "bg-emerald-50 border-emerald-200"
      }`}
    >
      <p
        className={`text-xs font-semibold ${
          isWarning ? "text-amber-700" : "text-emerald-700"
        }`}
      >
        {isWarning ? "⚠ Sesja wygasa wkrótce" : "Sesja aktywna"}
      </p>
      <span
        className={`font-mono font-black text-sm ${
          isWarning ? "text-amber-800" : "text-emerald-800"
        }`}
      >
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const { accounts, instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const router = useRouter();

  const [accessCode, setAccessCode] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('dashboardAccessCode') || '';
    }
    return '';
  });
  const [codeError, setCodeError] = useState<string | null>(null);
  const [className, setClassName] = useState<string | null>(null);
  const [activeSurveys, setActiveSurveys] = useState<Survey[]>([]);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [completedGroups, setCompletedGroups] = useState<number[]>([]);
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
    if (!isAuthenticated) router.push("/");
  }, [isAuthenticated, router]);

  const groupSurveys = (surveys: Survey[]): TeacherGroup[] => {
    const map = new Map<string, TeacherGroup>();

    surveys.forEach((s) => {
      if (s.isSchoolSurvey) {
        map.set(`school-${s.surveyId}`, {
          teacherName: "Ocena szkoły",
          subjects: [],
          surveyIds: [s.surveyId],
          startDate: s.startDate,
          endDate: s.endDate,
          isSchoolSurvey: true,
        });
        return;
      }

      const dashIdx = s.typeOrTeacher.indexOf(" – ");
      const teacherName =
        dashIdx !== -1
          ? s.typeOrTeacher.substring(0, dashIdx)
          : s.typeOrTeacher;
      const subject =
        dashIdx !== -1 ? s.typeOrTeacher.substring(dashIdx + 3) : null;

      let existing: TeacherGroup | undefined;
      for (const g of map.values()) {
        if (!g.isSchoolSurvey && g.teacherName === teacherName) {
          existing = g;
          break;
        }
      }

      if (existing) {
        if (subject && !existing.subjects.includes(subject))
          existing.subjects.push(subject);
        existing.surveyIds.push(s.surveyId);
      } else {
        map.set(s.surveyId.toString(), {
          teacherName,
          subjects: subject ? [subject] : [],
          surveyIds: [s.surveyId],
          startDate: s.startDate,
          endDate: s.endDate,
          isSchoolSurvey: false,
        });
      }
    });

    const teachers = Array.from(map.values())
      .filter((g) => !g.isSchoolSurvey)
      .sort((a, b) => a.teacherName.localeCompare(b.teacherName, "pl"));

    const schoolSurveys = Array.from(map.values()).filter(
      (g) => g.isSchoolSurvey,
    );

    return [...teachers, ...schoolSurveys];
  };

  useEffect(() => {
    const checkStatuses = async () => {
      if (activeSurveys.length === 0) return;
      setIsLoadingStatuses(true);
      const token = await getAccessToken();
      if (!token) {
        setIsLoadingStatuses(false);
        return;
      }

      const groups = groupSurveys(activeSurveys);

      const promises = groups.map(async (g) => {
        try {
          const res = await fetch(
            `${API_URL}/api/surveys/group/${g.surveyIds[0]}/is-completed?ids=${g.surveyIds.join(",")}`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          return res.ok && (await res.json()) ? g.surveyIds[0] : null;
        } catch {
          return null;
        }
      });

      const results = (await Promise.all(promises)).filter(
        (id): id is number => id !== null,
      );
      setCompletedGroups(results);
      setIsLoadingStatuses(false);
    };
    checkStatuses();
  }, [activeSurveys, getAccessToken]);

  const handleSearch = useCallback(async () => {
    if (!accessCode.trim()) return;
    setCodeError(null);
    setIsSearching(true);

    try {
      const msalToken = await getAccessToken();
      if (!msalToken) {
        setCodeError("Nie udało się pobrać tokena autoryzacji. Zaloguj się ponownie.");
        setIsSearching(false);
        return;
      }

      const res = await fetch(
        `${API_URL}/api/admin/surveys/active/by-code/${accessCode.trim().toUpperCase()}`,
        { headers: { Authorization: `Bearer ${msalToken}` } },
      );

      if (!res.ok) {
        setCodeError("Nie znaleziono klasy o tym kodzie. Sprawdź kod i spróbuj ponownie.");
        setActiveSurveys([]);
        setClassName(null);
        setTokenInfo(null);
        setIsSearching(false);
        return;
      }

      const data: { surveys: Survey[]; tokenInfo: TokenInfo } = await res.json();
      setActiveSurveys(data.surveys);
      setTokenInfo(data.tokenInfo);
      setClassName(data.surveys.length > 0 ? data.surveys[0].targetClass : accessCode);
    } catch {
      setCodeError("Błąd połączenia z serwerem.");
    }

    setIsSearching(false);
  }, [accessCode, getAccessToken]);

  // Auto-wyszukaj po powrocie jeśli kod jest zapisany
  useEffect(() => {
    if (isAuthenticated && accessCode && activeSurveys.length === 0) {
      handleSearch();
    }
  }, [isAuthenticated]);

  const allGroups = groupSurveys(activeSurveys);

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
                  const val = e.target.value.toUpperCase();
                  setAccessCode(val);
                  sessionStorage.setItem('dashboardAccessCode', val);
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

              {tokenInfo && <TokenCountdown tokenInfo={tokenInfo} />}

              {isLoadingStatuses ? (
                <p className="text-zinc-400 text-sm italic">Sprawdzanie statusu ankiet...</p>
              ) : allGroups.length > 0 ? (
                <div className="grid gap-4">
                  {allGroups.map((group) => {
                    const isCompleted = completedGroups.includes(group.surveyIds[0]);

                    return (
                      <div
                        key={group.surveyIds[0]}
                        className={`flex justify-between items-center p-4 rounded-xl border ${
                          group.isSchoolSurvey
                            ? "bg-emerald-50 border-emerald-200"
                            : "bg-zinc-50 border-zinc-200"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            {group.isSchoolSurvey && (
                              <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200">
                                Szkoła
                              </span>
                            )}
                            <p className="font-bold text-sm text-zinc-800">{group.teacherName}</p>
                          </div>
                          {group.subjects.length > 0 && (
                            <p className="text-xs text-zinc-500 mt-0.5">{group.subjects.join(", ")}</p>
                          )}
                          <p className="text-[10px] text-zinc-400 font-bold uppercase mt-1">
                            {group.startDate} – {group.endDate}
                          </p>
                        </div>

                        {isCompleted ? (
                          <div className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold border border-emerald-200 whitespace-nowrap">
                            ✓ Wysłano
                          </div>
                        ) : (

                            <a href={`/survey/group/${group.surveyIds[0]}?code=${accessCode}&ids=${group.surveyIds.join(",")}`}
                            className={`px-4 py-2 text-white rounded-lg text-sm font-bold transition-colors whitespace-nowrap ${
                              group.isSchoolSurvey
                                ? "bg-emerald-600 hover:bg-emerald-700"
                                : "bg-indigo-600 hover:bg-indigo-700"
                            }`}
                          >
                            Wypełnij
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-zinc-500 italic text-sm">Brak aktywnych ankiet dla tej klasy.</p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}