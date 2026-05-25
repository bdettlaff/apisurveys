"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "../../../components/Navbar/Navbar";

type Category = {
  id: number;
  name: string;
};

type SchoolClass = {
  id: number;
  name: string;
};

type Subject = {
  id: number;
  name: string;
};

export default function NewQuestionPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [availableClasses, setAvailableClasses] = useState<SchoolClass[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [questionId, setQuestionId] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("SCALE");
  const [categoryId, setCategoryId] = useState("");

  const [selectedClasses, setSelectedClasses] = useState<SchoolClass[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    fetch("http://localhost:8080/api/categories")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setCategories(data))
      .catch((err) => console.error("Błąd ładowania kategorii:", err));

    fetch("http://localhost:8080/api/classes")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setAvailableClasses(data))
      .catch((err) => console.error("Błąd ładowania klas:", err));

    fetch("http://localhost:8080/api/subjects")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setAvailableSubjects(data))
      .catch((err) => console.error("Błąd ładowania przedmiotów:", err));
  }, []);

  const handleSelectClass = (idString: string) => {
    if (!idString) return;
    const classId = Number(idString);
    const targetClass = availableClasses.find((c) => c.id === classId);
    if (targetClass && !selectedClasses.some((c) => c.id === classId)) {
      setSelectedClasses([...selectedClasses, targetClass]);
    }
  };

  const handleRemoveClass = (id: number) => {
    setSelectedClasses(selectedClasses.filter((c) => c.id !== id));
  };

  const handleSelectSubject = (idString: string) => {
    if (!idString) return;
    const subjectId = Number(idString);
    const targetSubject = availableSubjects.find((s) => s.id === subjectId);
    if (targetSubject && !selectedSubjects.some((s) => s.id === subjectId)) {
      setSelectedSubjects([...selectedSubjects, targetSubject]);
    }
  };

  const handleRemoveSubject = (id: number) => {
    setSelectedSubjects(selectedSubjects.filter((s) => s.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!questionId.trim() || !content.trim() || !categoryId) {
      alert("Wypełnij kod pytania, treść oraz wybierz kategorię!");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      id: questionId.trim().toUpperCase(),
      content,
      type,
      category: { id: Number(categoryId) },
      classes: selectedClasses.map((c) => ({ id: c.id })),
      subjects: selectedSubjects.map((s) => ({ id: s.id })),
    };

    try {
      const response = await fetch("http://localhost:8080/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.push("/admin/questions");
      } else {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Błąd serwera");
      }
    } catch (err: any) {
      alert(err.message || "Wystąpił błąd podczas dodawania nowego pytania.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 antialiased text-zinc-900 selection:bg-zinc-200">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 pt-32 pb-16">
        <div className="mb-8 text-left">
          <h1 className="text-3xl font-black tracking-tight uppercase text-zinc-900">
            Nowe Pytanie
          </h1>
          <p className="text-xs font-bold text-zinc-400 tracking-wider uppercase mt-1">
            Konfiguracja pytania z jawnym indeksem tekstowym (np. A1, Z1) dla
            ALO i TAU
          </p>
        </div>

        <div className="bg-white border border-zinc-200/60 rounded-2xl p-6 md:p-10 shadow-sm transition-all">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                Kod indeksu pytania (Unikalne ID tekstowe)
              </label>
              <input
                type="text"
                value={questionId}
                onChange={(e) => setQuestionId(e.target.value)}
                maxLength={10}
                className="w-full md:w-1/3 px-4 py-3 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-800 transition-all font-bold text-zinc-800 bg-zinc-50/50 focus:bg-white uppercase placeholder:normal-case placeholder:font-normal placeholder:text-zinc-400"
                placeholder="Np. A10, Z5a, L2"
              />
              <p className="text-[11px] text-zinc-400 mt-1.5 font-medium">
                Użyj schematu z bazy danych: <b className="text-zinc-600">A</b>{" "}
                (ogólne), <b className="text-zinc-600">L</b> (języki),{" "}
                <b className="text-zinc-600">S</b> (ścisłe),{" "}
                <b className="text-zinc-600">P</b> (polski),{" "}
                <b className="text-zinc-600">Z</b> (zawodowe).
              </p>
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                Treść pytania
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-800 transition-all font-medium text-zinc-800 bg-zinc-50/50 focus:bg-white resize-vertical placeholder:text-zinc-400"
                placeholder="Wpisz treść pytania, która wyświetli się uczniom w arkuszu..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                  Typ pytania
                </label>
                <div className="relative">
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-800 transition-all font-medium text-zinc-800 appearance-none cursor-pointer"
                  >
                    <option value="SCALE">Skala 1–5</option>
                    <option value="OPEN">Pytanie otwarte</option>
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

              <div className="flex flex-col">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                  Kategoria
                </label>
                <div className="relative">
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-800 transition-all font-medium text-zinc-800 appearance-none cursor-pointer"
                  >
                    <option value="">-- Wybierz kategorię --</option>
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
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                Przypisane Klasy (Wybierz z listy)
              </label>
              <div className="relative mb-3">
                <select
                  value=""
                  onChange={(e) => handleSelectClass(e.target.value)}
                  className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-800 transition-all font-medium text-zinc-800 appearance-none cursor-pointer"
                >
                  <option value="">-- Dodaj klasę do pytania --</option>
                  {availableClasses
                    .filter(
                      (c) => !selectedClasses.some((sel) => sel.id === c.id),
                    )
                    .map((schoolClass) => (
                      <option key={schoolClass.id} value={schoolClass.id}>
                        {schoolClass.name}
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

              <div className="flex flex-wrap gap-2">
                {selectedClasses.length === 0 ? (
                  <p className="text-xs font-medium text-zinc-400 italic">
                    Pytanie pojawi się we wszystkich klasach (globalne), jeśli
                    nie wybierzesz żadnej.
                  </p>
                ) : (
                  selectedClasses.map((c) => (
                    <span
                      key={c.id}
                      className="inline-flex items-center gap-1.5 bg-zinc-900 text-white px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider"
                    >
                      {c.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveClass(c.id)}
                        className="text-zinc-400 hover:text-red-400 font-bold ml-1 transition-colors"
                      >
                        &times;
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                Przypisane Przedmioty (Wybierz z listy)
              </label>
              <div className="relative mb-3">
                <select
                  value=""
                  onChange={(e) => handleSelectSubject(e.target.value)}
                  className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-800 transition-all font-medium text-zinc-800 appearance-none cursor-pointer"
                >
                  <option value="">-- Dodaj przedmiot do pytania --</option>
                  {availableSubjects
                    .filter(
                      (s) => !selectedSubjects.some((sel) => sel.id === s.id),
                    )
                    .map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
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

              <div className="flex flex-wrap gap-2">
                {selectedSubjects.length === 0 ? (
                  <p className="text-xs font-medium text-zinc-400 italic">
                    Pytanie będzie dotyczyło ogólnych aspektów szkoły, jeśli nie
                    przypiszesz przedmiotów.
                  </p>
                ) : (
                  selectedSubjects.map((s) => (
                    <span
                      key={s.id}
                      className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider"
                    >
                      {s.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveSubject(s.id)}
                        className="text-indigo-400 hover:text-red-500 font-bold ml-1 transition-colors"
                      >
                        &times;
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

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
                className="w-full sm:w-auto px-7 py-3 bg-zinc-900 hover:bg-black text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
              >
                {isSubmitting ? "Zapisywanie..." : "Zapisz pytanie"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
