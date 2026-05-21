"use client";

import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { TestBackendBtn } from "../components/TestBackendBtn/TestBackendBtn";
import { Navbar } from "../components/Navbar/Navbar";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import SurveyForm from "../components/Surveys/SurveyForm";

type SchoolClass = {
  id: number;
  name: string;
};

export default function DashboardPage() {
  const { accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const router = useRouter();

  const [classId, setClassId] = useState<number | null>(null);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [classesLoading, setClassesLoading] = useState<boolean>(false);
  const [classesError, setClassesError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchClasses() {
      try {
        setClassesLoading(true);
        setClassesError(null);

        // WAŻNE: bez końcowego slasha
        const res = await fetch("http://localhost:8080/api/classes");
        if (!res.ok) {
          throw new Error(`Nie udało się pobrać klas (status ${res.status}).`);
        }

        const data: SchoolClass[] = await res.json();
        setClasses(data);

        // jeśli było wybrane ID, ale nie istnieje w nowej liście — wyczyść
        setClassId((prev) => (prev !== null && data.some((c) => c.id === prev) ? prev : null));
      } catch (e: any) {
        setClasses([]);
        setClassId(null);
        setClassesError(e?.message ?? "Nie udało się pobrać listy klas");
      } finally {
        setClassesLoading(false);
      }
    }

    fetchClasses();
  }, [isAuthenticated]);

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    setClassId(v ? Number(v) : null);
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      <main className="flex flex-col items-center justify-center pt-32 pb-12 px-6">
        <div className="w-full max-w-2xl p-12 bg-white rounded-2xl shadow-xl flex flex-col items-center border border-zinc-200">
          <h1 className="text-3xl font-black text-tau-dark mb-2 text-center">
            Witaj, {accounts[0]?.name}!
          </h1>
          <p className="text-zinc-500 mb-6 text-center font-medium">
            Zalogowano pomyślnie do systemu ewaluacji
          </p>

          <div className="w-full max-w-xs mb-8 flex flex-col items-center">
            <label
              htmlFor="class-select"
              className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2"
            >
              Wybierz swoją klasę, aby wyświetlić nauczycieli:
            </label>

            <select
              id="class-select"
              onChange={handleClassChange}
              value={classId ?? ""}
              disabled={classesLoading || !!classesError}
              className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-700 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all cursor-pointer text-sm shadow-sm"
            >
              <option value="">-- Wybierz klasę --</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {classesLoading && (
              <div className="mt-2 text-xs text-zinc-400">Ładowanie listy klas...</div>
            )}
            {classesError && (
              <div className="mt-2 text-xs text-red-500">Błąd: {classesError}</div>
            )}
          </div>

          <div className="w-full flex justify-center pt-4 border-t border-zinc-100">
            <TestBackendBtn />
          </div>

          {classId !== null ? (
            <div className="w-full mt-8 pt-8 border-t border-zinc-100">
              <SurveyForm classId={classId} />
            </div>
          ) : (
            <div className="w-full mt-8 pt-8 border-t border-zinc-100 text-center text-sm text-zinc-400 italic">
              Wybierz klasę powyżej, aby wyświetlić listę nauczycieli.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
