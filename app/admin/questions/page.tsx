"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "../../components/Navbar/Navbar";
import { useIsAuthenticated } from "@azure/msal-react";
import { useAuthFetch } from "../../hooks/useAuthFetch";
import AdminGuard from "../../components/AdminGuard/AdminGuard";
import { API_URL } from '@/lib/api'

type Category = {
  id: number;
  name: string;
};

type Question = {
  id: string;
  content: string;
  type: string;
  module: string;
  classRequirement: string;
  isActive: boolean;
  category: Category;
};

export default function QuestionsPage() {
  const isAuthenticated = useIsAuthenticated();
  const authFetch = useAuthFetch();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  useEffect(() => {
    if (!isAuthenticated) return;

    authFetch(`${API_URL}/api/questions`)
      .then((res) => res.json())
      .then((data) => setQuestions(data))
      .catch((err) => console.error("Błąd pobierania pytań:", err));

    authFetch(`${API_URL}/api/categories`)
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error("Błąd pobierania kategorii:", err));
  }, [authFetch, isAuthenticated]);

  const filtered = questions.filter((q) => {
    const searchLower = search.toLowerCase();
    const matchSearch =
      q.content?.toLowerCase().includes(searchLower) ||
      q.id?.toLowerCase().includes(searchLower);
    const matchCategory = filterCategory
      ? q.category?.id === Number(filterCategory)
      : true;
    return matchSearch && matchCategory;
  });

  return (
    <AdminGuard>
      <div className="min-h-screen bg-zinc-50 antialiased text-zinc-900 selection:bg-zinc-200">
        <Navbar />

        <main className="max-w-6xl mx-auto px-4 pt-32 pb-16">
          <div className="mb-8">
            <h1 className="text-3xl font-black tracking-tight uppercase text-zinc-900">
              Baza Pytań
            </h1>
            <p className="text-xs font-bold text-zinc-400 tracking-wider uppercase mt-1">
              Przeglądanie i edycja pytań systemu ewaluacji
            </p>
          </div>

          {/* Filtry */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Szukaj pytania po treści lub kodzie (np. A1, Z5)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-4 pr-10 py-3 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-800 transition-all font-medium text-zinc-800 bg-white placeholder:text-zinc-400 shadow-sm"
              />
            </div>

            <div className="relative">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full sm:w-56 px-4 py-3 border border-zinc-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-800 transition-all font-medium text-zinc-800 appearance-none cursor-pointer shadow-sm"
              >
                <option value="">Wszystkie kategorie</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-zinc-400">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Tabela */}
          <div className="bg-white border border-zinc-200/60 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-100">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500 w-24">
                      Kod
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Treść pytania
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500 w-32">
                      Typ
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500 w-44">
                      Kategoria
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500 w-44">
                      Moduł
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500 w-28 text-right">
                      Akcje
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-medium text-zinc-800">
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-center py-12 text-zinc-400 font-medium"
                      >
                        Brak pytań spełniających kryteria wyszukiwania.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((q) => (
                      <tr
                        key={q.id}
                        className="hover:bg-zinc-50/60 transition-colors"
                      >
                        <td className="px-6 py-4 font-bold text-zinc-900 whitespace-nowrap">
                          <span className="bg-zinc-100 border border-zinc-200 text-zinc-800 px-2.5 py-1 rounded-lg text-xs font-mono tracking-wide">
                            {q.id}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-zinc-800 max-w-md break-words">
                          {q.content}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide ${
                              q.type === "SCALE"
                                ? "bg-zinc-50 border border-zinc-200 text-zinc-700"
                                : "bg-indigo-50 border border-indigo-100 text-indigo-600"
                            }`}
                          >
                            {q.type === "SCALE" ? "Skala 1-5" : "Otwarte"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-500 whitespace-nowrap">
                          {q.category?.name || (
                            <span className="text-zinc-300">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-zinc-500 whitespace-nowrap">
                          {q.module || <span className="text-zinc-300">—</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Link href={`/admin/questions/${q.id}`}>
                            <button className="px-3 py-1.5 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-bold uppercase tracking-wider rounded-lg transition-all active:scale-95">
                              Edytuj
                            </button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
