"use client";

import { useState, useEffect } from "react";
import { useIsAuthenticated } from "@azure/msal-react";
import { useRouter } from "next/navigation";
import { TeacherSelector } from "../../components/TeacherSelector/TeacherSelector";
import { Navbar } from "../../components/Navbar/Navbar";
import { StatsChart } from "../../components/StatsChart/StatsChart";
import { CommentList } from "../../components/CommentList/CommentList";

export default function SurveyResultsPage() {
  const isAuthenticated = useIsAuthenticated();
  const router = useRouter();

  const [data, setData] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<string[]>(["Wszystkie przedmioty"]);
  const [teachers, setTeachers] = useState<any[]>([]);

  const [selectedSubject, setSelectedSubject] = useState(
    "Wszystkie przedmioty",
  );
  const [selectedTeacherId, setSelectedTeacherId] = useState("all");

  useEffect(() => {
    fetch("http://localhost:8080/api/results/all")
      .then((res) => res.json())
      .then(setData);
    fetch("http://localhost:8080/api/results/subjects-list")
      .then((res) => res.json())
      .then((s) => setSubjects(["Wszystkie przedmioty", ...s]));
    fetch("http://localhost:8080/api/results/teachers-list")
      .then((res) => res.json())
      .then(setTeachers);
  }, []);

  const displayedTeachers = data.filter((t) => {
    // Logika filtra: sprawdza czy wybrano "Wszystkie" lub czy nazwy przedmiotów są identyczne
    const matchSubject =
      selectedSubject === "Wszystkie przedmioty" ||
      t.subjectName === selectedSubject;

    const matchTeacher =
      selectedTeacherId === "all" ||
      t.teacherId.toString() === selectedTeacherId;

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
            teacherId: t.id.toString(),
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
            <p className="text-sm text-zinc-500 mb-4">
              Przedmiot: {teacher.subjectName}
            </p>

            {teacher.totalVotes > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <StatsChart
                  stats={{
                    A1: { avg: teacher.avgClarity, label: "Jasność" },
                    L4: { avg: teacher.avgPreparation, label: "Przygotowanie" },
                    B2: { avg: teacher.avgFairness, label: "Sprawiedliwość" },
                    C1: { avg: teacher.avgCulture, label: "Kultura" },
                  }}
                  totalVotes={teacher.totalVotes}
                />
                <CommentList
                  comments={{
                    positive: teacher.comments
                      .filter((c: any) => c.type === "POZYTYWNA")
                      .map((c: any) => c.text),
                    constructive: teacher.comments
                      .filter((c: any) => c.type === "KONSTRUKTYWNA")
                      .map((c: any) => c.text),
                    internal: [],
                  }}
                />
              </div>
            ) : (
              <p className="text-zinc-400 mt-4">
                Brak ocen dla tego nauczyciela.
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
