"use client";

import { useMsal, useIsAuthenticated } from "@azure/msal-react";
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
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isAuthenticated) router.push("/");
  }, [isAuthenticated, router]);

  useEffect(() => {
    async function fetchClasses() {
      try {
        const res = await fetch("http://localhost:8080/api/classes");
        const data = await res.json();
        setClasses(data);
      } catch (err) {
        console.error("Błąd ładowania klas:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchClasses();
  }, []);

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setClassId(val ? Number(val) : null);
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar />
      <main className="flex flex-col items-center justify-center pt-32 px-6">
        <div className="w-full max-w-2xl p-12 bg-white rounded-2xl shadow-xl border border-zinc-200">
          <h1 className="text-3xl font-black text-center mb-6">
            Witaj, {accounts[0]?.name}!
          </h1>

          <label className="block text-xs font-bold text-zinc-400 uppercase text-center mb-2">
            {loading ? "Ładowanie klas..." : "Wybierz klasę:"}
          </label>

          <select
            onChange={handleClassChange}
            className="w-full px-4 py-2.5 bg-zinc-50 border rounded-xl"
            disabled={loading}
          >
            <option value="">-- Wybierz --</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>

          {classId !== null && (
            <div className="mt-8 pt-8 border-t border-zinc-100">
              <SurveyForm classId={classId} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
