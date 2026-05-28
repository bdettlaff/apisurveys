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
  isSchoolSurvey: boolean;
};

type TeacherGroup = {
  teacherName: string;
  subjects: string[];
  surveyIds: number[];
  startDate: string;
  endDate: string;
  isSchoolSurvey: boolean;
};

export default function DashboardPage() {
  const { accounts, instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const router = useRouter();

  const [accessCode, setAccessCode] = useState<string>("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [className, setClassName] = useState<string | null>(null);
  const [activeSurveys, setActiveSurveys] = useState<Survey[]>([]);
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

  // Grupuje ankiety nauczycielskie po nazwisku; ankiety szkolne trafiają osobno
  const groupSurveys = (surveys: Survey[]): TeacherGroup[] => {
    const map = new Map<string, TeacherGroup>();

    surveys.forEach((s) => {
      // Ankieta szkolna — osobna karta, klucz unikalny po surveyId
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

      // Ankieta nauczycielska — format "Jan Kowalski – Matematyka"
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
        if (subject && !existing.subjects.includes(subject)) {
          existing.subjects.push(subject);
        }
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

    // Nauczyciele alfabetycznie, ankieta szkolna zawsze na końcu
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
            `http://localhost:8080/api/surveys/group/${g.surveyIds[0]}/is-completed?ids=${g.surveyIds.join(",")}`,
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

  const handleSearch = async () => {
    if (!accessCode.trim()) return;
    setCodeError(null);
    setIsSearching(true);
    try {
      const res = await fetch(
        `http://localhost:8080/api/admin/surveys/active/by-code/${accessCode.trim().toUpperCase()}`,
      );
      if (!res.ok) {
        setCodeError(
          "Nie znaleziono klasy o tym kodzie. Sprawdź kod i spróbuj ponownie.",
        );
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

          {/* Pole kodu */}
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
              <p className="text-red-500 text-xs mt-2 font-medium">
                {codeError}
              </p>
            )}
          </div>

          {/* Lista ankiet */}
          {className !== null && (
            <div className="border-t pt-8">
              <h2 className="font-bold text-lg mb-4 text-zinc-800">
                Ankiety dla klasy {className}:
              </h2>

              {isLoadingStatuses ? (
                <p className="text-zinc-400 text-sm italic">
                  Sprawdzanie statusu ankiet...
                </p>
              ) : allGroups.length > 0 ? (
                <div className="grid gap-4">
                  {allGroups.map((group) => {
                    const isCompleted = completedGroups.includes(
                      group.surveyIds[0],
                    );

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
                            <p className="font-bold text-sm text-zinc-800">
                              {group.teacherName}
                            </p>
                          </div>
                          {group.subjects.length > 0 && (
                            <p className="text-xs text-zinc-500 mt-0.5">
                              {group.subjects.join(", ")}
                            </p>
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
                          <a
                            href={`/survey/group/${group.surveyIds[0]}?code=${accessCode}&ids=${group.surveyIds.join(",")}`}
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
