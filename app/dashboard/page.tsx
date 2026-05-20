"use client";

import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { TestBackendBtn } from "../components/TestBackendBtn/TestBackendBtn";
import { Navbar } from "../components/Navbar/Navbar";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import SurveyForm from "../components/Surveys/SurveyForm";

export default function DashboardPage() {
  const { accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const router = useRouter();
  
  const [classSlug, setClassSlug] = useState<string>("");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    if (selectedValue) {
      setClassSlug(`${selectedValue}-2026`);
    } else {
      setClassSlug("");
    }
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
            <label htmlFor="class-select" className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Wybierz swoją klasę, aby załadować ankiety:
            </label>
            <select
              id="class-select"
              onChange={handleClassChange}
              className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-zinc-700 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all cursor-pointer text-sm shadow-sm"
            >
              <option value="">-- Wybierz klasę --</option>
              <option value="1tl">1TL TAU</option>
              <option value="1tp">1TP TAU</option>
              <option value="1tp-e">1TP-E TAU</option>
              <option value="1a">1a ALO</option>
              <option value="2tl">2TL TAU</option>
              <option value="2tp">2TP TAU</option>
              <option value="2a">2a ALO</option>
              <option value="3tl">3TL TAU</option>
              <option value="3tp-1">3TP GR-1 TAU</option>
              <option value="3tp-2">3TP GR-2 TAU</option>
              <option value="3tp-e">3TP-E TAU</option>
              <option value="3a">3a ALO</option>
              <option value="4tl">4TL TAU</option>  
              <option value="4tp">4TP TAU</option>
              <option value="4tp-e">4TP-E TAU</option>
              <option value="4a">4a ALO</option>
              <option value="5tl">5TL TAU</option>
              <option value="5tp">5TP TAU</option>
              <option value="5tp-e">5TP-E TAU</option>
            </select>
          </div>

          <div className="w-full flex justify-center pt-4 border-t border-zinc-100">
            <TestBackendBtn />
          </div>

          {classSlug ? (
            <div className="w-full mt-8 pt-8 border-t border-zinc-100">
              <div className="mb-4 text-center">
                <span className="text-xs bg-blue-50 text-blue-600 font-mono font-bold px-3 py-1 rounded-full border border-blue-100">
                  Wczytany slug: {classSlug}
                </span>
              </div>
              <SurveyForm slug={classSlug} />
            </div>
          ) : (
            <div className="w-full mt-8 pt-8 border-t border-zinc-100 text-center text-sm text-zinc-400 italic">
              Wybierz klasę powyżej, aby wyświetlić przypisane bloki oceniania.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}