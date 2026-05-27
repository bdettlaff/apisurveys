"use client";

import { useState, useEffect } from "react";
import { useIsAuthenticated } from "@azure/msal-react";
import { Navbar } from "../../components/Navbar/Navbar";
import { StatsChart } from "../../components/StatsChart/StatsChart";
import { CommentList } from "../../components/CommentList/CommentList";
import { TeacherSelector } from "../../components/TeacherSelector/TeacherSelector";

export default function SurveyResultsPage() {
  const isAuthenticated = useIsAuthenticated();
  const [data, setData] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<string[]>(["Wszystkie przedmioty"]);
  const [teachers, setTeachers] = useState<any[]>([]);

  const [selectedSubject, setSelectedSubject] = useState("Wszystkie przedmioty");
  const [selectedTeacherId, setSelectedTeacherId] = useState("all");
  const [selectedClass, setSelectedClass] = useState("Wszystkie klasy");

  useEffect(() => {
    Promise.all([
      fetch("http://localhost:8080/api/results/all").then((res) => res.json()),
      fetch("http://localhost:8080/api/results/subjects-list").then((res) => res.json()),
      fetch("http://localhost:8080/api/results/teachers-list").then((res) => res.json()),
    ])
      .then(([results, subs, teachs]) => {
        setData(results || []);
        setSubjects(["Wszystkie przedmioty", ...(subs || [])]);
        setTeachers(teachs || []);
      })
      .catch((err) => console.error("Błąd ładowania danych:", err));
  }, []);

  const allClasses = Array.from(new Set(data.flatMap((t) => t.classNames || [])));

  const getStatsForDisplay = (teacher: any) => {
    let statsSource =
      selectedClass === "Wszystkie klasy"
        ? teacher.averages
        : teacher.averagesPerClass?.[selectedClass];
    if (!statsSource) return {};
    const stats: any = {};
    Object.keys(statsSource).forEach((key) => {
      if (key.startsWith("avg")) {
        stats[key] = { avg: statsSource[key], label: key.replace("avg", "") };
      }
    });
    return stats;
  };

  const getTotalVotesForDisplay = (teacher: any) => {
    if (selectedClass === "Wszystkie klasy") return teacher.totalVotes;
    return teacher.totalVotesPerClass?.[selectedClass] || 0;
  };

  const getCommentsForDisplay = (teacher: any) => {
    return selectedClass === "Wszystkie klasy"
      ? teacher.comments || []
      : teacher.commentsPerClass?.[selectedClass] || [];
  };

  // średnia ze wszystkich pytań nauczyciela (dla aktualnie wybranej klasy)
  const getOverallAverage = (teacher: any): number | null => {
    const stats = getStatsForDisplay(teacher);
    const values = Object.values(stats).map((s: any) => s.avg);
    if (values.length === 0) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  };

  // kolor badge wg średniej (skala 1-10)
  const getBadgeColor = (avg: number) => {
    if (avg >= 8) return "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
    if (avg >= 6) return "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800";
    if (avg >= 4) return "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800";
    return "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800";
  };

  const displayedTeachers = data
    .filter((t) => {
      const votes = getTotalVotesForDisplay(t);
      if (votes === 0) return false;
      const matchSubject =
        selectedSubject === "Wszystkie przedmioty" || t.subjectName === selectedSubject;
      const matchTeacher =
        selectedTeacherId === "all" || String(t.teacherId) === String(selectedTeacherId);
      const matchClass =
        selectedClass === "Wszystkie klasy" ||
        (t.classNames && t.classNames.includes(selectedClass));
      return matchSubject && matchTeacher && matchClass;
    })
    .sort((a, b) => {
      const avgA = getOverallAverage(a) ?? -1;
      const avgB = getOverallAverage(b) ?? -1;
      return avgB - avgA; // malejąco
    });

  if (!isAuthenticated)
    return <div className="p-10 text-center dark:text-zinc-100">Trwa autoryzacja...</div>;

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-900 pt-28 pb-12">
      <Navbar />
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-wrap gap-4 items-end">
          <TeacherSelector
            subjects={subjects}
            selectedSubject={selectedSubject}
            onSubjectChange={setSelectedSubject}
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
              {allClasses.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>
          </div>
        </div>

        {displayedTeachers.length > 0 ? (
          displayedTeachers.map((teacher) => {
            const currentComments = getCommentsForDisplay(teacher);
            const currentVotes = getTotalVotesForDisplay(teacher);
            const questionTexts = teacher.questionTexts || {};
            const overallAvg = getOverallAverage(teacher);

            return (
              <div
                key={`${teacher.teacherId}-${selectedClass}`}
                className="bg-white dark:bg-zinc-800 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-700 shadow-sm"
              >
                <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
                  <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">
                    {teacher.teacherName}
                  </h2>
                  {overallAvg !== null && (
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${getBadgeColor(overallAvg)}`}>
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                        Średnia ogólna
                      </span>
                      <span className="text-sm font-black">
                        {overallAvg.toFixed(2)} / 10
                      </span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <StatsChart
                      stats={getStatsForDisplay(teacher)}
                      totalVotes={currentVotes}
                      questionTexts={questionTexts}
                    />
                  </div>
                  <CommentList
                    comments={{
                      positive: currentComments
                        .filter((c: any) => c.type === "POZYTYWNA")
                        .map((c: any) => ({ text: c.text, questionText: c.questionText })),
                      constructive: currentComments
                        .filter((c: any) => c.type === "KONSTRUKTYWNA")
                        .map((c: any) => ({ text: c.text, questionText: c.questionText })),
                      internal: currentComments
                        .filter((c: any) => c.type === "INTERNAL")
                        .map((c: any) => ({ text: c.text, questionText: c.questionText })),
                    }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-20 text-zinc-400">
            Brak wyników spełniających kryteria.
          </div>
        )}
      </div>
    </div>
  );
}
