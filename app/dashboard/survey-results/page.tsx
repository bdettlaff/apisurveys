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

  const [selectedSubject, setSelectedSubject] = useState(
    "Wszystkie przedmioty",
  );
  const [selectedTeacherId, setSelectedTeacherId] = useState("all");
  const [selectedClass, setSelectedClass] = useState("Wszystkie klasy");

  useEffect(() => {
    Promise.all([
      fetch("http://localhost:8080/api/results/all").then((res) => res.json()),
      fetch("http://localhost:8080/api/results/subjects-list").then((res) =>
        res.json(),
      ),
      fetch("http://localhost:8080/api/results/teachers-list").then((res) =>
        res.json(),
      ),
    ])
      .then(([results, subs, teachs]) => {
        setData(results || []);
        setSubjects(["Wszystkie przedmioty", ...(subs || [])]);
        setTeachers(teachs || []);
      })
      .catch((err) => console.error("Błąd ładowania danych:", err));
  }, []);

  // Pobranie unikalnych klas tylko z tych rekordów, które mają jakiekolwiek dane
  const allClasses = Array.from(
    new Set(data.flatMap((t) => t.classNames || [])),
  );

  const getCleanStats = (teacher: any) => {
    if (!teacher.averages) return {};
    const stats: any = {};
    Object.keys(teacher.averages).forEach((key) => {
      if (key.startsWith("avg")) {
        stats[key] = {
          avg: teacher.averages[key],
          label: key.replace("avg", ""),
        };
      }
    });
    return stats;
  };

  const displayedTeachers = data.filter((t) => {
    // Ukrywamy nauczycieli bez głosów
    if (t.totalVotes === 0) return false;

    const matchSubject =
      selectedSubject === "Wszystkie przedmioty" ||
      t.subjectName === selectedSubject;
    const matchTeacher =
      selectedTeacherId === "all" ||
      String(t.teacherId) === String(selectedTeacherId);
    const matchClass =
      selectedClass === "Wszystkie klasy" ||
      (t.classNames && t.classNames.includes(selectedClass));
    return matchSubject && matchTeacher && matchClass;
  });

  if (!isAuthenticated)
    return <div className="p-10 text-center">Trwa autoryzacja...</div>;

  return (
    <div className="min-h-screen bg-zinc-50/50 pt-28 pb-12">
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
            <label className="text-sm font-semibold text-zinc-600">
              Filtruj po klasie
            </label>
            <select
              className="p-3 rounded-xl border bg-white shadow-sm min-w-[200px]"
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
          displayedTeachers.map((teacher) => (
            <div
              key={teacher.teacherId}
              className="bg-white p-8 rounded-3xl border shadow-sm"
            >
              <h2 className="text-xl font-black mb-6">{teacher.teacherName}</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <StatsChart
                    stats={getCleanStats(teacher)}
                    totalVotes={teacher.totalVotes}
                  />
                </div>
                <CommentList
                  comments={{
                    positive: (teacher.comments || [])
                      .filter((c: any) => c.type === "POZYTYWNA")
                      .map((c: any) => c.text),
                    constructive: (teacher.comments || [])
                      .filter((c: any) => c.type === "KONSTRUKTYWNA")
                      .map((c: any) => c.text),
                    internal: (teacher.comments || [])
                      .filter((c: any) => c.type === "INTERNAL")
                      .map((c: any) => c.text),
                  }}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 text-zinc-400">
            Brak wyników spełniających kryteria filtrowania.
          </div>
        )}
      </div>
    </div>
  );
}
