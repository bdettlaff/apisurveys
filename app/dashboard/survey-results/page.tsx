"use client";

import { useState, useMemo, useEffect } from "react";
import { useIsAuthenticated } from "@azure/msal-react";
import { useRouter } from "next/navigation";
import { TeacherSelector } from "../../components/TeacherSelector/TeacherSelector";
import { Navbar } from "../../components/Navbar/Navbar";
import { StatsChart } from "../../components/StatsChart/StatsChart";
import { CommentList } from "../../components/CommentList/CommentList";

const CURRENT_YEAR = 2026;

const MOCK_AGREGATED_STATS = [
  {
    teacherId: "1",
    teacherName: "Jan Kowalski",
    subjectId: "MAT-01",
    subjectName: "Matematyka",
    totalVotes: 142,
    year: 2026,
    stats: {
      A1: { avg: 4.5, label: "Jasność przekazu" },
      L4: { avg: 4.8, label: "Punktualność i przygotowanie" },
      B2: { avg: 3.9, label: "Sprawiedliwość oceniania" },
      C1: { avg: 4.2, label: "Kultura osobista" },
    },
  },
  {
    teacherId: "2",
    teacherName: "Anna Nowak",
    subjectId: "ANG-02",
    subjectName: "Język Angielski",
    totalVotes: 98,
    year: 2026,
    stats: {
      A1: { avg: 4.9, label: "Jasność przekazu" },
      L4: { avg: 4.2, label: "Punktualność i przygotowanie" },
      B2: { avg: 4.7, label: "Sprawiedliwość oceniania" },
      C1: { avg: 4.6, label: "Kultura osobista" },
    },
  },
  {
    teacherId: "5",
    teacherName: "Tomasz Nowakowski",
    subjectId: "MAT-01",
    subjectName: "Matematyka",
    totalVotes: 45,
    year: 2026,
    stats: {
      A1: { avg: 4.0, label: "Jasność przekazu" },
      L4: { avg: 4.2, label: "Punktualność i przygotowanie" },
      B2: { avg: 4.6, label: "Sprawiedliwość oceniania" },
      C1: { avg: 4.1, label: "Kultura osobista" },
    },
  },
  {
    teacherId: "3",
    teacherName: "Robert Wiśniewski",
    subjectId: "INF-03",
    subjectName: "Informatyka",
    totalVotes: 64,
    year: 2026,
    stats: {
      A1: { avg: 3.8, label: "Jasność przekazu" },
      L4: { avg: 4.0, label: "Punktualność i przygotowanie" },
      B2: { avg: 3.5, label: "Sprawiedliwość oceniania" },
      C1: { avg: 4.8, label: "Kultura osobista" },
    },
  },
  {
    teacherId: "4",
    teacherName: "Michał Zieliński",
    subjectId: "MAT-01",
    subjectName: "Matematyka",
    totalVotes: 110,
    year: 2025,
    stats: {
      A1: { avg: 4.2, label: "Jasność przekazu" },
      L4: { avg: 4.5, label: "Punktualność i przygotowanie" },
      B2: { avg: 4.1, label: "Sprawiedliwość oceniania" },
      C1: { avg: 4.4, label: "Kultura osobista" },
    },
  },
];

const MOCK_COMMENTS: Record<
  string,
  { positive: string[]; constructive: string[]; internal: string[] }
> = {
  "1": {
    positive: [
      "Świetnie tłumaczy trudne zagadnienia.",
      "Zawsze przygotowany do lekcji.",
    ],
    constructive: ["Bardzo dużo zadaje do domu.", "Szybko dyktuje notatki."],
    internal: ["Nauczyciel zgłaszał problem z hałasem w klasie 4TA."],
  },
  "2": {
    positive: [
      "Lekcje są bardzo interaktywne.",
      "Super atmosfera na zajęciach.",
    ],
    constructive: ["Mogłoby być mniej niezapowiedzianych kartkówek."],
    internal: ["Wzorowa organizacja pracy."],
  },
  "3": {
    positive: ["Podejście z pasją, pomoc przy projektach po lekcjach."],
    constructive: ["Sprzęt w sali laboratoryjnej często nie działa."],
    internal: ["Planowane szkolenie z zakresu nowych frameworków."],
  },
  "4": {
    positive: [
      "Bardzo spokojne podejście do uczniów.",
      "Dokładnie omawia sprawdziany.",
    ],
    constructive: ["Spóźnia się czasami po przerwach."],
    internal: ["Nowy nauczyciel kontraktowy."],
  },
  "5": {
    positive: ["Bardzo kulturalny człowiek.", "Zawsze odpowie na pytania."],
    constructive: ["Słabo słychać go w tylnych ławkach."],
    internal: ["Brak uwag dyscyplinarnych."],
  },
};

export default function SurveyResultsPage() {
  const isAuthenticated = useIsAuthenticated();
  const router = useRouter();

  const currentYearStats = useMemo(
    () => MOCK_AGREGATED_STATS.filter((t) => t.year === CURRENT_YEAR),
    [],
  );

  const uniqueSubjects = useMemo(
    () => [
      "Wszystkie przedmioty",
      ...new Set(currentYearStats.map((t) => t.subjectName)),
    ],
    [currentYearStats],
  );

  const [selectedSubject, setSelectedSubject] = useState(uniqueSubjects[0]);
  const [selectedTeacherId, setSelectedTeacherId] = useState("all");

  const { teachersForDropdown, displayedTeachers } = useMemo(() => {
    const filteredBySubject =
      selectedSubject === "Wszystkie przedmioty"
        ? currentYearStats
        : currentYearStats.filter((t) => t.subjectName === selectedSubject);

    const displayed =
      selectedTeacherId === "all"
        ? filteredBySubject
        : filteredBySubject.filter((t) => t.teacherId === selectedTeacherId);

    return {
      teachersForDropdown: filteredBySubject,
      displayedTeachers: displayed,
    };
  }, [selectedSubject, selectedTeacherId, currentYearStats]);

  const handleSubjectChange = (subject: string) => {
    setSelectedSubject(subject);
    setSelectedTeacherId("all");
  };

  useEffect(() => {
    if (!isAuthenticated) router.push("/");
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50">
        <p className="text-zinc-500 font-bold animate-pulse">
          Trwa sprawdzanie autoryzacji...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/50 pt-28 pb-12">
      <Navbar />
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900 uppercase">
              Wyniki Ankiet ({CURRENT_YEAR})
            </h1>
            <p className="text-sm font-bold text-zinc-400 mt-0.5">
              Panel porównawczo-zarządczy ocen kadry nauczycielskiej
            </p>
          </div>
          <TeacherSelector
            subjects={uniqueSubjects}
            selectedSubject={selectedSubject}
            onSubjectChange={handleSubjectChange}
            teachers={teachersForDropdown}
            selectedTeacherId={selectedTeacherId}
            onTeacherChange={setSelectedTeacherId}
          />
        </div>

        <div className="space-y-12">
          {displayedTeachers.map((teacher) => (
            <div
              key={`${teacher.teacherId}-${selectedSubject}-${selectedTeacherId}`}
              className="bg-white p-6 md:p-8 rounded-3xl border border-zinc-100 shadow-sm space-y-6 animate-fadeIn"
            >
              <div className="border-b border-zinc-100 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h2 className="text-xl font-black text-zinc-900 tracking-tight">
                    {teacher.teacherName}
                  </h2>
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mt-0.5">
                    {teacher.subjectName}
                  </p>
                </div>
                <div className="bg-zinc-50 px-4 py-2 rounded-xl border border-zinc-100 self-start sm:self-center">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                    Liczba głosów:{" "}
                  </span>
                  <span className="text-sm font-black text-zinc-700">
                    {teacher.totalVotes}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2">
                  <StatsChart
                    stats={teacher.stats}
                    totalVotes={teacher.totalVotes}
                  />
                </div>
                <div className="lg:col-span-1">
                  <CommentList
                    comments={
                      MOCK_COMMENTS[teacher.teacherId] || {
                        positive: [],
                        constructive: [],
                        internal: [],
                      }
                    }
                  />
                </div>
              </div>
            </div>
          ))}

          {displayedTeachers.length === 0 && (
            <div className="bg-white p-12 text-center rounded-3xl border border-zinc-100 shadow-sm">
              <p className="text-zinc-400 font-bold">
                Brak aktualnych wyników spełniających kryteria.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
