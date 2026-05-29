"use client";

import { useEffect, useState } from "react";

interface Teacher {
  id: number;
  firstName: string;
  lastName: string;
}

interface Subject {
  id: number;
  name: string;
}

interface EvaluationBlock {
  id: number;
  teacher: Teacher;
  subject: Subject;
}

export default function SurveyForm({ classId }: { classId: number }) {
  const [blocks, setBlocks] = useState<EvaluationBlock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeBlock, setActiveBlock] = useState<EvaluationBlock | null>(null);
  const [completedBlocks, setCompletedBlocks] = useState<number[]>([]);

  useEffect(() => {
    async function fetchBlocks() {
      setLoading(true);
      setActiveBlock(null);
      setCompletedBlocks([]); 
      try {
        const res = await fetch(
          `http://localhost:8080/api/classes/${classId}/blocks`,
        );
        const data = await res.json();
        setBlocks(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchBlocks();
  }, [classId]);

  const handleSurveySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeBlock) {
      setCompletedBlocks((prev) => [...prev, activeBlock.id]);
      setActiveBlock(null);
    }
  };

  if (loading) return <p className="text-center text-zinc-500 text-sm font-medium">Ładowanie...</p>;
  if (blocks.length === 0) return <p className="text-center text-zinc-400 text-sm italic">Brak przypisanych nauczycieli dla tej klasy.</p>;

  if (completedBlocks.length === blocks.length && blocks.length > 0) {
    return (
      <div className="w-full text-center py-10 px-6 bg-white border border-zinc-200 rounded-2xl shadow-sm animate-fadeIn">
        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
          ✓
        </div>
        <h2 className="text-xl font-black text-zinc-800 tracking-tight">Wszystkie ankiety uzupełnione!</h2>
        <p className="text-zinc-500 text-sm mt-2 max-w-sm mx-auto font-medium">
          Dziękujemy za Twój czas. Twoje odpowiedzi pomogą w podnoszeniu jakości nauczania w naszej szkole.
        </p>
      </div>
    );
  }

  if (activeBlock) {
    return (
      <div className="w-full">
        <button
          onClick={() => setActiveBlock(null)}
          className="mb-6 flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-800 transition-colors group"
        >
          <span className="transform group-hover:-translate-x-1 transition-transform">←</span> 
          Powrót do listy nauczycieli
        </button>

        <div className="p-6 bg-zinc-50 border border-zinc-200 rounded-2xl mb-8 text-left w-full">
          <h2 className="text-xl font-black text-zinc-800">
            {activeBlock.teacher?.firstName} {activeBlock.teacher?.lastName}
          </h2>
          <p className="text-zinc-500 font-medium text-sm mt-1">
            Przedmiot: {activeBlock.subject?.name}
          </p>
        </div>

        <form 
          onSubmit={handleSurveySubmit} 
          className="space-y-6 text-left w-full"
        >
          <div className="p-6 bg-white border border-zinc-200 shadow-sm rounded-xl">
            <p className="font-semibold text-zinc-700 mb-4 text-sm">
              1. Jak oceniasz jasność przekazywania wiedzy przez nauczyciela? <span className="text-red-500">*</span>
            </p>
            <div className="flex gap-4">
              {[1, 2, 3, 4, 5].map((grade) => (
                <label key={grade} className="flex-1 text-center p-3 border border-zinc-200 rounded-xl cursor-pointer hover:bg-zinc-50 transition-colors">
                  <input 
                    type="radio" 
                    name="q1" 
                    value={grade} 
                    className="mb-2 block mx-auto text-blue-600 focus:ring-blue-500" 
                    required 
                  />
                  <span className="font-bold text-sm text-zinc-600">{grade}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 transition-colors shadow-md text-sm"
          >
            Zatwierdź i wyślij ankietę
          </button>
        </form>
      </div>
    );
  }

  const sortedBlocks = [...blocks].sort((a, b) => {
    const aCompleted = completedBlocks.includes(a.id) ? 1 : 0;
    const bCompleted = completedBlocks.includes(b.id) ? 1 : 0;
    return aCompleted - bCompleted;
  });

  return (
    <div className="w-full space-y-3.5">
      <div className="text-right px-1 mb-1">
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
          Postęp: {completedBlocks.length} / {blocks.length}
        </span>
      </div>

      {sortedBlocks.map((b) => {
        const isCompleted = completedBlocks.includes(b.id);

        return (
          <div
            key={b.id}
            onClick={() => !isCompleted && setActiveBlock(b)}
            className={`w-full flex items-center justify-between p-5 border rounded-2xl transition-all duration-200 
              ${isCompleted 
                ? "bg-zinc-50/60 border-zinc-200 opacity-60 cursor-not-allowed select-none" 
                : "bg-white border-zinc-200 shadow-sm hover:border-zinc-400 hover:shadow-md cursor-pointer group"
              }`}
          >
            <div className="flex flex-col items-start text-left pr-4">
              <h4 className={`text-base font-bold tracking-tight transition-colors ${isCompleted ? "text-zinc-500 line-through" : "text-zinc-800 group-hover:text-black"}`}>
                {b.teacher?.firstName} {b.teacher?.lastName}
              </h4>
              <p className="text-xs text-zinc-400 font-semibold mt-0.5 tracking-wide">
                {b.subject?.name}
              </p>
              {isCompleted && (
                <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200/60 px-2 py-0.5 rounded-md mt-2 flex items-center gap-1">
                  ✓ Ankieta wysłana (brak możliwości ponownego wypełnienia)
                </span>
              )}
            </div>

            {!isCompleted && (
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-zinc-50 group-hover:bg-zinc-950 border border-zinc-200 group-hover:border-zinc-950 text-zinc-400 group-hover:text-white transition-all duration-200 shadow-sm shrink-0">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth="2.5" 
                  stroke="currentColor" 
                  className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform duration-200"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}