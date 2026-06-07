"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Navbar } from "../../../components/Navbar/Navbar";
import { useIsAuthenticated } from "@azure/msal-react";
import { useAuthFetch } from "../../../hooks/useAuthFetch";
import AdminGuard from "../../../components/AdminGuard/AdminGuard";
import { API_URL } from '@/lib/api'

type Category = { id: number; name: string };
type SchoolClass = { id: number; name: string };

export default function EditQuestionPage() {
  const router = useRouter();
  const { id } = useParams();
  const isAuthenticated = useIsAuthenticated();
  const authFetch = useAuthFetch();

  const [categories, setCategories] = useState<Category[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    content: "",
    type: "SCALE",
    classRequirement: "",
    categoryId: "",
  });

  useEffect(() => {
    if (!isAuthenticated) return;

    authFetch(`${API_URL}/api/categories`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setCategories)
      .catch(() => setCategories([]));

    authFetch(`${API_URL}/api/classes`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setClasses)
      .catch(() => setClasses([]));

    if (id) {
      authFetch(`${API_URL}/api/questions/${id}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data && data.content !== undefined) {
            setForm({
              content: data.content,
              type: data.type ?? "SCALE",
              classRequirement: data.classRequirement ?? "",
              categoryId: data.category?.id?.toString() ?? "",
            });
          }
        })
        .catch(() => {});
    }
  }, [id, authFetch, isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.content || !form.categoryId) {
      alert("Wypełnij treść pytania i wybierz kategorię!");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await authFetch(
        `${API_URL}/api/questions/${id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            content: form.content,
            type: form.type,
            module: null,
            classRequirement: form.classRequirement || null,
            category: { id: Number(form.categoryId) },
          }),
        },
      );
      if (response.ok) {
        router.push("/admin/questions");
      } else {
        throw new Error();
      }
    } catch {
      alert("Nie udało się zapisać zmian w pytaniu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const SelectArrow = () => (
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
  );

  return (
    <AdminGuard>
      <div className="min-h-screen bg-zinc-50 antialiased text-zinc-900 selection:bg-zinc-200">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 pt-32 pb-16">
          <div className="mb-8">
            <h1 className="text-3xl font-black tracking-tight uppercase text-zinc-900">
              Edycja Pytania
            </h1>
            <p className="text-xs font-bold text-zinc-400 tracking-wider uppercase mt-1">
              Modyfikacja parametrów i struktury pytania #{id}
            </p>
          </div>

          <div className="bg-white border border-zinc-200/60 rounded-2xl p-6 md:p-10 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Treść */}
              <div className="flex flex-col">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                  Treść pytania
                </label>
                <textarea
                  value={form.content}
                  onChange={(e) =>
                    setForm({ ...form, content: e.target.value })
                  }
                  rows={4}
                  className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-800 transition-all font-medium text-zinc-800 bg-zinc-50/50 focus:bg-white resize-vertical placeholder:text-zinc-400"
                  placeholder="Wpisz pełną treść pytania dla uczniów..."
                />
              </div>

              {/* Typ + Kategoria */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                    Typ pytania
                  </label>
                  <div className="relative">
                    <select
                      value={form.type}
                      onChange={(e) =>
                        setForm({ ...form, type: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-800 transition-all font-medium text-zinc-800 appearance-none cursor-pointer"
                    >
                      <option value="SCALE">Skala 1–10</option>
                      <option value="OPEN">Pytanie otwarte</option>
                    </select>
                    <SelectArrow />
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                    Kategoria
                  </label>
                  <div className="relative">
                    <select
                      value={form.categoryId}
                      onChange={(e) =>
                        setForm({ ...form, categoryId: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-800 transition-all font-medium text-zinc-800 appearance-none cursor-pointer"
                    >
                      <option value="">-- Wybierz kategorię --</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <SelectArrow />
                  </div>
                </div>
              </div>

              {/* Przypisanie do klasy */}
              <div className="flex flex-col">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                  Przypisanie do klasy
                </label>
                <div className="relative">
                  <select
                    value={form.classRequirement}
                    onChange={(e) =>
                      setForm({ ...form, classRequirement: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-800 transition-all font-medium text-zinc-800 appearance-none cursor-pointer"
                  >
                    <option value="">
                      -- Brak (pytanie ogólne dla wszystkich klas) --
                    </option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <SelectArrow />
                </div>
                <p className="text-[11px] text-zinc-400 mt-1.5 font-medium">
                  Pytania ogólne (bez przypisania) trafiają do każdego bloku
                  ankiety. Pytania przypisane do klasy pojawiają się tylko w
                  ankietach tej klasy.
                </p>
              </div>

              {/* Przyciski */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-6 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => router.push("/admin/questions")}
                  className="w-full sm:w-auto px-6 py-3 border border-zinc-200 text-zinc-700 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-zinc-50 transition-all active:scale-[0.98]"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-7 py-3 bg-zinc-900 hover:bg-black text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmitting ? "Zapisywanie zmian..." : "Zapisz zmiany"}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
