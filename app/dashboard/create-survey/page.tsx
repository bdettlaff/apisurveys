"use client";

import { useEffect, useState, useMemo } from "react";
import { Navbar } from "../../components/Navbar/Navbar";
import { useIsAuthenticated } from "@azure/msal-react";
import { useAuthFetch } from "../../hooks/useAuthFetch";
import AdminGuard from "../../components/AdminGuard/AdminGuard";
import { API_URL } from '../../../lib/api'

type SchoolClass = { id: number; name: string };
type Category = { id: number; name: string };
type Question = {
  id: string;
  content: string;
  type: string;
  category: Category;
};
type SurveyBlock = {
  id: number;
  teacherId: number | null;
  teacherName: string;
  subjectId: number | null;
  subjectName: string;
  module: string;
  isSchoolSection: boolean;
  questions: Question[];
};

export default function CreateSurveyPage() {
  const isAuthenticated = useIsAuthenticated();
  const authFetch = useAuthFetch();

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [blocks, setBlocks] = useState<SurveyBlock[]>([]);
  const [selectedQuestionsPerBlock, setSelectedQuestionsPerBlock] = useState<
    Record<string, string[]>
  >({});
  const [classId, setClassId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [savedClassName, setSavedClassName] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    authFetch("${API_URL}/api/classes")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setClasses(data))
      .catch(() => setClasses([]));
  }, [authFetch, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!classId) {
      setBlocks([]);
      setSelectedQuestionsPerBlock({});
      setGeneratedCode(null);
    } else {
      authFetch(`${API_URL}/api/classes/${classId}/survey-blocks`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data: SurveyBlock[]) => {
          setBlocks(data);
          const initialSelection: Record<string, string[]> = {};
          data.forEach((block) => {
            const blockKey = block.isSchoolSection
              ? "school-general-section"
              : String(block.id);
            initialSelection[blockKey] = (block.questions || []).map(
              (q) => q.id,
            );
          });
          setSelectedQuestionsPerBlock(initialSelection);
        })
        .catch(() => {
          setBlocks([]);
          setSelectedQuestionsPerBlock({});
        });
    }
  }, [classId, authFetch, isAuthenticated]);

  const handleToggleQuestion = (blockKey: string, questionId: string) => {
    const currentSelected = selectedQuestionsPerBlock[blockKey] || [];
    if (currentSelected.includes(questionId)) {
      setSelectedQuestionsPerBlock({
        ...selectedQuestionsPerBlock,
        [blockKey]: currentSelected.filter((id) => id !== questionId),
      });
    } else {
      setSelectedQuestionsPerBlock({
        ...selectedQuestionsPerBlock,
        [blockKey]: [...currentSelected, questionId],
      });
    }
  };

  const totalSelectedQuestionsCount = useMemo(() => {
    return Object.values(selectedQuestionsPerBlock).reduce(
      (acc, curr) => acc + curr.length,
      0,
    );
  }, [selectedQuestionsPerBlock]);

  const handleCopyCode = () => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!classId || !startDate || !endDate) {
      setErrorMsg("Uzupełnij klasę oraz zakres obowiązywania ankiety!");
      return;
    }
    const teacherSurveys = blocks
      .filter((block) => !block.isSchoolSection)
      .map((block) => ({
        teacherId: block.teacherId,
        subjectId: block.subjectId,
        questionIds: selectedQuestionsPerBlock[String(block.id)] || [],
      }))
      .filter(
        (survey) =>
          survey.questionIds.length > 0 && survey.teacherId && survey.subjectId,
      );

    const schoolQuestionIds =
      selectedQuestionsPerBlock["school-general-section"] || [];
    setIsSubmitting(true);

    try {
      const response = await authFetch(
        "${API_URL}/api/admin/surveys/composite",
        {
          method: "POST",
          body: JSON.stringify({
            classId: Number(classId),
            startDate,
            endDate,
            teacherSurveys,
            schoolQuestionIds,
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        const cls = classes.find((c) => String(c.id) === classId);
        setSavedClassName(cls?.name || "");
        setGeneratedCode(data.accessCode);
        setShowModal(true);
        setStartDate("");
        setEndDate("");
      } else {
        throw new Error();
      }
    } catch {
      setErrorMsg("Wystąpił problem podczas komunikacji z API zapisu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedClass = classes.find((c) => String(c.id) === classId);

  return (
    <AdminGuard>
      <div className="min-h-screen bg-zinc-50 antialiased text-zinc-900 selection:bg-zinc-200">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 pt-28 pb-16">
          <div className="mb-8">
            <h1 className="text-3xl font-black tracking-tight uppercase text-zinc-900">
              Zarządzanie Ankietami
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            <div className="lg:col-span-2 bg-white border border-zinc-200/60 rounded-2xl p-6 shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                    Wybierz oddział
                  </label>
                  <select
                    value={classId}
                    onChange={(e) => {
                      setClassId(e.target.value);
                      setGeneratedCode(null);
                    }}
                    className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm bg-zinc-50/50 focus:bg-white font-medium text-zinc-800"
                  >
                    <option value="">-- Wybierz klasę --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                      Data startu
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                      Data końca
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-4 py-3 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700"
                    />
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">
                    {errorMsg}
                  </div>
                )}

                <div className="pt-4 border-t border-zinc-100">
                  <button
                    type="submit"
                    disabled={isSubmitting || blocks.length === 0}
                    className="w-full py-3.5 bg-zinc-900 hover:bg-black text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40"
                  >
                    {isSubmitting
                      ? "Zapisywanie struktury..."
                      : `Zapisz ${blocks.length} sekcji w systemie`}
                  </button>
                </div>
              </form>

              {generatedCode && !showModal && (
                <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">
                    ✓ Kod dostępu dla klasy {savedClassName}:
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="flex-1 font-mono font-black text-xl text-emerald-900 tracking-widest">
                      {generatedCode}
                    </span>
                    <button
                      onClick={handleCopyCode}
                      className="px-3 py-2 bg-emerald-700 text-white text-xs font-bold rounded-lg hover:bg-emerald-800 transition-colors"
                    >
                      {codeCopied ? "Skopiowano!" : "Kopiuj"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-3 space-y-4">
              <div className="bg-zinc-900 text-white rounded-2xl p-6 shadow-xl">
                <h2 className="text-xs font-black tracking-widest text-zinc-400 uppercase mb-4">
                  Stan struktury pytań
                </h2>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between border-b border-zinc-800 pb-2">
                    <span className="text-zinc-400">Aktywny oddział:</span>
                    <span className="font-bold text-indigo-400">
                      {selectedClass?.name || "Nie wybrano"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Suma wybranych pytań:</span>
                    <span className="font-bold text-emerald-400">
                      {totalSelectedQuestionsCount}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {blocks.length === 0 ? (
                  <div className="bg-white text-center py-16 border border-zinc-200/60 rounded-2xl text-zinc-400 text-sm">
                    Wskaż oddział szkolny, aby pobrać dynamiczne zestawy pytań z
                    bazy danych.
                  </div>
                ) : (
                  blocks.map((block) => {
                    const blockKey = block.isSchoolSection
                      ? "school-general-section"
                      : String(block.id);
                    const selectedIds =
                      selectedQuestionsPerBlock[blockKey] || [];
                    return (
                      <div
                        key={blockKey}
                        className={`border rounded-2xl p-5 shadow-sm space-y-3 ${block.isSchoolSection ? "bg-indigo-50/20 border-indigo-100" : "bg-white border-zinc-200/60"}`}
                      >
                        <div className="flex justify-between items-start border-b border-zinc-100 pb-3">
                          <div>
                            <h3
                              className={`text-sm font-black ${block.isSchoolSection ? "text-indigo-950" : "text-zinc-900"}`}
                            >
                              {block.teacherName}
                            </h3>
                            <p className="text-xs font-semibold text-zinc-400 uppercase mt-0.5">
                              {block.subjectName} •{" "}
                              <span className="font-bold text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded text-[10px]">
                                {block.module}
                              </span>
                            </p>
                          </div>
                          <span className="bg-zinc-100 border text-[10px] font-bold px-2 py-1 rounded-md text-zinc-700">
                            {selectedIds.length} aktywnych
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {!block.questions || block.questions.length === 0 ? (
                            <p className="text-[11px] text-zinc-400 italic py-1">
                              Brak przypisanych pytań w tej kategorii
                              przedmiotowej.
                            </p>
                          ) : (
                            block.questions.map((q) => {
                              const isChecked = selectedIds.includes(q.id);
                              return (
                                <label
                                  key={q.id}
                                  className={`flex items-start gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition-all select-none ${isChecked ? (block.isSchoolSection ? "bg-indigo-50/40 border-indigo-200 text-zinc-800" : "bg-emerald-50/30 border-emerald-100 text-zinc-800") : "bg-zinc-100/40 border-zinc-200 text-zinc-400/70 opacity-60"}`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() =>
                                      handleToggleQuestion(blockKey, q.id)
                                    }
                                    className="mt-0.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 accent-zinc-900"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium break-words leading-tight">
                                      <span className="font-mono font-bold mr-1 text-[10px] border px-1 rounded bg-zinc-100 text-zinc-900">
                                        {q.id}
                                      </span>
                                      {q.content}
                                    </p>
                                  </div>
                                </label>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </main>

        {showModal && generatedCode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border border-zinc-200">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-3xl">✓</span>
                </div>
              </div>
              <h2 className="text-xl font-black text-center text-zinc-900 mb-2">
                Ankieta zapisana!
              </h2>
              <p className="text-center text-sm text-zinc-500 mb-6">
                Kod dostępu dla klasy{" "}
                <span className="font-bold text-zinc-800">
                  {savedClassName}
                </span>
                :
              </p>

              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-300 rounded-2xl p-6 mb-4">
                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest text-center mb-2">
                  Kod klasy
                </p>
                <p className="font-mono font-black text-3xl text-emerald-900 tracking-widest text-center break-all">
                  {generatedCode}
                </p>
              </div>

              <p className="text-xs text-center text-zinc-400 mb-5">
                Przekaż ten kod uczniom — pozwoli im zobaczyć przypisane
                ankiety.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleCopyCode}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold uppercase tracking-wider transition-colors"
                >
                  {codeCopied ? "✓ Skopiowano!" : "Kopiuj kod"}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-zinc-900 hover:bg-black text-white rounded-xl text-sm font-bold uppercase tracking-wider transition-colors"
                >
                  Zamknij
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminGuard>
  );
}
