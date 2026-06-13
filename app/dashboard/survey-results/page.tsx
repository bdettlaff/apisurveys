"use client";

import { useEffect, useState } from "react";
import { Navbar } from "../../components/Navbar/Navbar";
import { StatsChart } from "../../components/StatsChart/StatsChart";
import { CommentList } from "../../components/CommentList/CommentList";
import { TeacherSelector } from "../../components/TeacherSelector/TeacherSelector";
import { exportResultsToExcel } from "../../components/ExportToexcel/exportToExcel";
import { useIsAuthenticated } from "@azure/msal-react";
import { useAuthFetch } from "../../hooks/useAuthFetch";
import { API_URL } from '@/lib/api'

export default function SurveyResultsPage() {
  const isAuthenticated = useIsAuthenticated();
  const authFetch = useAuthFetch();

  const [data, setData] = useState<any[]>([]);
  const [schoolData, setSchoolData] = useState<any | null>(null);
  const [subjects, setSubjects] = useState<string[]>(["Wszystkie przedmioty"]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const handlePrint = () => window.print();

  const [selectedSubject, setSelectedSubject] = useState(
    "Wszystkie przedmioty",
  );
  const [selectedTeacherId, setSelectedTeacherId] = useState("all");
  const [selectedClass, setSelectedClass] = useState("Wszystkie klasy");

  useEffect(() => {
    if (!isAuthenticated) return; // ← czekaj aż użytkownik będzie zalogowany

    const fetchSchool = (r: Response) => {
      if (r.status === 204 || r.headers.get("content-length") === "0")
        return null;
      return r.json().catch(() => null);
    };

    Promise.all([
      authFetch(`${API_URL}/api/results/all`).then((r) => r.json()),
      authFetch(`${API_URL}/api/results/school`).then(fetchSchool),
      authFetch(`${API_URL}/api/results/subjects-list`).then((r) =>
        r.json(),
      ),
      authFetch(`${API_URL}/api/results/teachers-list`).then((r) =>
        r.json(),
      ),
    ])
      .then(([results, school, subs, teachs]) => {
        setData(results || []);
        setSchoolData(school || null);
        setSubjects(["Wszystkie przedmioty", ...(subs || [])]);
        setTeachers(teachs || []);
      })
      .catch((err) => console.error("Błąd ładowania danych:", err));
  }, [authFetch, isAuthenticated]); // ← dodane isAuthenticated

  const allClasses = Array.from(
    new Set([
      ...data.flatMap((t) => t.classNames || []),
      ...(schoolData?.classNames || []),
    ]),
  ).sort();

  const getStatsForDisplay = (item: any) => {
    const source =
      selectedClass === "Wszystkie klasy"
        ? item.averages
        : item.averagesPerClass?.[selectedClass];
    if (!source) return {};
    const stats: any = {};
    Object.keys(source).forEach((key) => {
      if (key.startsWith("avg")) {
        stats[key] = { avg: source[key], label: key.replace("avg", "") };
      }
    });
    return stats;
  };

  const getTotalVotes = (item: any): number => {
    if (selectedClass === "Wszystkie klasy") return item.totalVotes ?? 0;
    return item.totalVotesPerClass?.[selectedClass] ?? 0;
  };

  const getTeacherComments = (item: any) => {
    const list =
      selectedClass === "Wszystkie klasy"
        ? item.comments || []
        : item.commentsPerClass?.[selectedClass] || [];
    return list.filter((c: any) => c.type !== "SCHOOL_OPEN");
  };

  const getSchoolOpenComments = (item: any) => {
    const list =
      selectedClass === "Wszystkie klasy"
        ? item.comments || []
        : item.commentsPerClass?.[selectedClass] || [];
    return list.filter((c: any) => c.type === "SCHOOL_OPEN");
  };

  const getOverallAverage = (item: any): number | null => {
    const stats = getStatsForDisplay(item);
    const values = Object.values(stats).map((s: any) => s.avg);
    if (values.length === 0) return null;
    return values.reduce((a: number, b: number) => a + b, 0) / values.length;
  };

  const getBadgeColor = (avg: number) => {
    if (avg >= 8)
      return "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
    if (avg >= 6)
      return "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800";
    if (avg >= 4)
      return "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800";
    return "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800";
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const schoolArray = schoolData ? [schoolData] : [];
      exportResultsToExcel(data, schoolArray);
    } catch (err) {
      console.error("Błąd eksportu:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const displayedTeachers = data
    .filter((t) => {
      if (getTotalVotes(t) === 0) return false;
      if (
        selectedTeacherId !== "all" &&
        String(t.teacherId) !== String(selectedTeacherId)
      )
        return false;
      if (
        selectedSubject !== "Wszystkie przedmioty" &&
        t.subjectName !== selectedSubject
      )
        return false;
      if (
        selectedClass !== "Wszystkie klasy" &&
        !(t.classNames || []).includes(selectedClass)
      )
        return false;
      return true;
    })
    .sort(
      (a, b) => (getOverallAverage(b) ?? -1) - (getOverallAverage(a) ?? -1),
    );

  const showSchool =
    schoolData != null &&
    getTotalVotes(schoolData) > 0 &&
    selectedTeacherId === "all" &&
    selectedSubject === "Wszystkie przedmioty" &&
    (selectedClass === "Wszystkie klasy" ||
      (schoolData.classNames || []).includes(selectedClass));

  const renderTeacherCard = (item: any, key: string) => {
    const comments = getTeacherComments(item);
    const votes = getTotalVotes(item);
    const questionTexts = item.questionTexts || {};
    const overallAvg = getOverallAverage(item);

    return (
      <div
        key={key}
        className="bg-white dark:bg-zinc-800 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-700 shadow-sm"
      >
        <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
          <div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">
              {item.teacherName}
            </h2>
            {item.subjectName && (
              <span className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                {item.subjectName}
              </span>
            )}
          </div>
          {overallAvg !== null && (
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${getBadgeColor(overallAvg)}`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                Średnia ogólna
              </span>
              <span className="text-sm font-black">
                {overallAvg.toFixed(2)} / 5
              </span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
          <div className="lg:col-span-2">
            <StatsChart
              stats={getStatsForDisplay(item)}
              totalVotes={votes}
              questionTexts={questionTexts}
            />
          </div>
          <CommentList
            comments={{
              positive: comments
                .filter((c: any) => c.type === "POZYTYWNA")
                .map((c: any) => ({
                  text: c.text,
                  questionText: c.questionText,
                })),
              constructive: comments
                .filter((c: any) => c.type === "KONSTRUKTYWNA")
                .map((c: any) => ({
                  text: c.text,
                  questionText: c.questionText,
                })),
              internal: comments
                .filter((c: any) => c.type === "INTERNAL")
                .map((c: any) => ({
                  text: c.text,
                  questionText: c.questionText,
                })),
            }}
          />
        </div>
      </div>
    );
  };

  const renderSchoolCard = () => {
    const item = schoolData;
    const votes = getTotalVotes(item);
    const questionTexts = item.questionTexts || {};
    const overallAvg = getOverallAverage(item);
    const schoolComments = getSchoolOpenComments(item);

    return (
      <div className="bg-white dark:bg-zinc-800 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-700 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">
            Ocena szkoły
          </h2>
          {overallAvg !== null && (
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${getBadgeColor(overallAvg)}`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                Średnia ogólna
              </span>
              <span className="text-sm font-black">
                {overallAvg.toFixed(2)} / 5
              </span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <StatsChart
              stats={getStatsForDisplay(item)}
              totalVotes={votes}
              questionTexts={questionTexts}
            />
          </div>
          <CommentList
            comments={{
              positive: [],
              constructive: schoolComments.map((c: any) => ({
                text: c.text,
                questionText: c.questionText,
              })),
              internal: [],
            }}
          />
        </div>
      </div>
    );
  };

  if (!isAuthenticated)
    return (
      <div className="p-10 text-center dark:text-zinc-100">
        Trwa autoryzacja...
      </div>
    );

  const hasAnything = showSchool || displayedTeachers.length > 0;
  const hasAnyData =
    data.some((t) => (t.totalVotes ?? 0) > 0) ||
    (schoolData && (schoolData.totalVotes ?? 0) > 0);

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-900 pt-28 pb-12">
      <Navbar />
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-wrap gap-4 items-end justify-between">
          <div className="flex flex-wrap gap-4 items-end">
            <TeacherSelector
              subjects={subjects}
              selectedSubject={selectedSubject}
              onSubjectChange={(v) => {
                setSelectedSubject(v);
                setSelectedTeacherId("all");
              }}
              teachers={teachers.map((t) => ({
                teacherId: String(t.id),
                teacherName: `${t.firstName} ${t.lastName}`,
              }))}
              selectedTeacherId={selectedTeacherId}
              onTeacherChange={setSelectedTeacherId}
            />
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                Filtruj po klasie
              </label>
              <select
                className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 dark:text-zinc-100 shadow-sm min-w-[200px]"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="Wszystkie klasy">Wszystkie klasy</option>
                {allClasses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {hasAnyData && (
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-300 text-white rounded-xl text-sm font-bold transition-colors whitespace-nowrap"
            >
              {isExporting ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  Eksportowanie...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Eksportuj do Excel
                </>
              )}
            </button>
            <button onClick={handlePrint}>
              Eksportuj PDF
            </button>
          )}
        </div>

        {showSchool && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 px-1">
              Ocena szkoły
            </h3>
            {renderSchoolCard()}
          </div>
        )}

        {displayedTeachers.length > 0 && (
          <div className="space-y-6">
            {showSchool && (
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 px-1">
                Oceny nauczycieli
              </h3>
            )}
            {displayedTeachers.map((t) =>
              renderTeacherCard(
                t,
                `${t.teacherId}-${t.subjectName ?? "brak"}-${selectedClass}`,
              ),
            )}
          </div>
        )}

        {!hasAnything && (
          <div className="text-center py-20 text-zinc-400">
            Brak wyników spełniających kryteria.
          </div>
        )}
      </div>
    </div>
  );
}
