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
      .catch((err) => console.error("Błąd ładowania:", err));
  }, []);

  const getCleanStats = (teacher: any) => {
    // Sprawdzamy, czy obiekt teacher zawiera mapę averages
    if (!teacher.averages) return {};

    const stats: any = {};

    // Iterujemy po mapie averages przesyłanej z backendu
    Object.keys(teacher.averages).forEach((key) => {
      const avgValue = teacher.averages[key];

      // key to np. "avgA1", "avgL1"
      // label to "A1", "L1"
      const label = key.replace("avg", "");

      stats[key] = {
        avg: avgValue,
        label: label,
      };
    });

    return stats;
  };

  const displayedTeachers = data.filter((t) => {
    const matchSubject =
      selectedSubject === "Wszystkie przedmioty" ||
      t.subjectName === selectedSubject;
    const matchTeacher =
      selectedTeacherId === "all" ||
      String(t.teacherId) === String(selectedTeacherId);
    return matchSubject && matchTeacher;
  });

  if (!isAuthenticated)
    return <div className="p-10 text-center">Trwa autoryzacja...</div>;

  return (
    <div className="min-h-screen bg-zinc-50/50 pt-28 pb-12">
      <Navbar />
      <div className="p-6 max-w-7xl mx-auto space-y-8">
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

        {displayedTeachers.map((teacher) => (
          <div
            key={teacher.teacherId}
            className="bg-white p-8 rounded-3xl border shadow-sm"
          >
            <h2 className="text-xl font-black">{teacher.teacherName}</h2>
            {teacher.totalVotes > 0 ? (
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
            ) : (
              <p className="text-zinc-400">Brak głosów.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
