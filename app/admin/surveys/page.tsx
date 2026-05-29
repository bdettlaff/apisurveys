"use client";

import React, { useEffect, useState } from "react";
import { Navbar } from "../../components/Navbar/Navbar";
import { useIsAuthenticated } from "@azure/msal-react";
import { useAuthFetch } from "../../hooks/useAuthFetch";
import AdminGuard from "../../components/AdminGuard/AdminGuard";

interface ActiveSurvey {
  surveyId: number;
  typeOrTeacher: string;
  targetClass: string;
  startDate: string;
  endDate: string;
  accessCode: string | null;
}

export default function ActiveSurveysPage() {
  const isAuthenticated = useIsAuthenticated();
  const authFetch = useAuthFetch();

  const [surveys, setSurveys] = useState<ActiveSurvey[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedClasses, setExpandedClasses] = useState<string[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    authFetch("http://localhost:8080/api/admin/surveys/active")
      .then((res) => {
        if (!res.ok) throw new Error("Nie udało się pobrać danych");
        return res.json();
      })
      .then((data: ActiveSurvey[]) => {
        setSurveys(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [authFetch, isAuthenticated]);

  const surveysByClass = surveys.reduce(
    (acc, survey) => {
      if (!acc[survey.targetClass]) acc[survey.targetClass] = [];
      acc[survey.targetClass].push(survey);
      return acc;
    },
    {} as Record<string, ActiveSurvey[]>,
  );

  const toggleClass = (className: string) => {
    setExpandedClasses((prev) =>
      prev.includes(className)
        ? prev.filter((c) => c !== className)
        : [...prev, className],
    );
  };

  const handleCopy = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  if (loading)
    return <div className="p-20 text-center font-bold">Ładowanie...</div>;

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="p-6 max-w-4xl mx-auto pt-28">
          <h1 className="text-3xl font-bold mb-8 text-gray-900">
            Aktywne ankiety wg klas
          </h1>

          {error ? (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
              Błąd: {error}
            </div>
          ) : Object.keys(surveysByClass).length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500 font-medium">
                Brak aktywnych ankiet w systemie.
              </p>
            </div>
          ) : (
            Object.entries(surveysByClass).map(([className, classSurveys]) => {
              const code = classSurveys[0].accessCode;
              return (
                <div
                  key={className}
                  className="mb-4 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => toggleClass(className)}
                    className="w-full p-6 flex justify-between items-center hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xl font-bold text-gray-900">
                        Klasa {className}
                      </span>
                      <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">
                        {classSurveys.length}{" "}
                        {classSurveys.length === 1
                          ? "aktywna ankieta"
                          : "aktywne ankiety"}
                      </span>

                      {code && (
                        <span className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                            Kod:
                          </span>
                          <span className="font-mono font-black text-sm text-emerald-900 tracking-widest">
                            {code}
                          </span>
                          <span
                            onClick={(e) => handleCopy(code, e)}
                            className="text-[10px] font-bold bg-emerald-700 text-white px-2 py-0.5 rounded hover:bg-emerald-800 cursor-pointer"
                          >
                            {copiedCode === code ? "OK ✓" : "Kopiuj"}
                          </span>
                        </span>
                      )}
                    </div>
                    <span className="text-gray-400 font-bold">
                      {expandedClasses.includes(className) ? "▲" : "▼"}
                    </span>
                  </button>

                  {expandedClasses.includes(className) && (
                    <div className="px-6 pb-6 pt-2 border-t border-gray-100 bg-gray-50/50">
                      <div className="space-y-3 mt-3">
                        {classSurveys.map((survey) => (
                          <div
                            key={survey.surveyId}
                            className="p-4 bg-white rounded-lg border border-gray-200 flex justify-between items-center shadow-sm"
                          >
                            <div>
                              <p className="font-bold text-gray-800">
                                {survey.typeOrTeacher}
                              </p>
                              <p className="text-xs text-gray-500 font-medium">
                                {survey.startDate} — {survey.endDate}
                              </p>
                            </div>
                            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">
                              AKTYWNA
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </main>
      </div>
    </AdminGuard>
  );
}
