"use client";

import React, { useEffect, useState } from "react";

interface Teacher {
  id: number;
  firstName: string;
  lastName: string;
}

interface SurveyFormProps {
  classId: number;
}

export default function SurveyForm({ classId }: SurveyFormProps) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!classId) return;

    async function fetchTeachers() {
      try {
        setLoading(true);
        setError(null);

        // WAŻNE: bez końcowego slasha
        const res = await fetch(`http://localhost:8080/api/classes/${classId}/teachers`);
        if (!res.ok) {
          throw new Error(`Nie udało się pobrać nauczycieli (status ${res.status}).`);
        }

        const data: Teacher[] = await res.json();
        setTeachers(data);
      } catch (e: any) {
        setTeachers([]);
        setError(e?.message ?? "Wystąpił błąd");
      } finally {
        setLoading(false);
      }
    }

    fetchTeachers();
  }, [classId]);

  if (loading) {
    return <div className="p-6 text-center text-gray-600">Ładowanie nauczycieli...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">Błąd: {error}</div>;
  }

  if (teachers.length === 0) {
    return <div className="p-6 text-center">Brak przypisanych nauczycieli dla tej klasy.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-50 min-h-[40vh]">
      <header className="mb-6 border-b pb-3">
        <h2 className="text-xl font-bold text-gray-800">Nauczyciele klasy</h2>
        <p className="text-sm text-gray-600">
          Klasa ID: <span className="font-semibold">{classId}</span>
        </p>
      </header>

      <ul className="space-y-2">
        {teachers.map((t) => (
          <li key={t.id} className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
            <div className="font-semibold text-gray-900">
              {t.firstName} {t.lastName}
            </div>
            <div className="text-xs text-gray-500">ID: {t.id}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
