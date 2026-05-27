"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMsal } from "@azure/msal-react";
import { Navbar } from "../../components/Navbar/Navbar";

export default function FillSurveyPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { instance, accounts } = useMsal();

  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showAlreadyModal, setShowAlreadyModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isFormComplete =
    questions.length > 0 && Object.keys(answers).length === questions.length;

  const getAccessToken = useCallback(async () => {
    if (accounts.length === 0) throw new Error("Nie jesteś zalogowany.");
    const response = await instance.acquireTokenSilent({
      scopes: ["api://d5614add-3e17-42b6-a294-fc218d0f61e6/access_as_user"],
      account: accounts[0],
    });
    return response.accessToken;
  }, [instance, accounts]);

  useEffect(() => {
    async function loadQuestions() {
      if (!id || accounts.length === 0) return;
      try {
        const token = await getAccessToken();
        const res = await fetch(
          `http://localhost:8080/api/surveys/${id}/questions`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error(`Błąd API: ${res.status}`);
        const data = await res.json();
        setQuestions(data);
      } catch (err) {
        console.error("Błąd ładowania pytań:", err);
      } finally {
        setLoading(false);
      }
    }
    loadQuestions();
  }, [id, accounts, getAccessToken]);

  const handleSubmit = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const token = await getAccessToken();
      const response = await fetch(
        `http://localhost:8080/api/surveys/${id}/submit`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(answers),
        }
      );

      if (response.status === 409) {
        setShowAlreadyModal(true);
        return;
      }

      if (!response.ok) throw new Error("Wystąpił błąd podczas wysyłania.");

      setShowSuccessModal(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Nieznany błąd");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 pt-28 pb-12">
        <Navbar />
        <main className="max-w-2xl mx-auto p-6">
          <div className="bg-white dark:bg-zinc-800 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-700 shadow-sm animate-pulse">
            <div className="h-8 w-1/2 mx-auto bg-zinc-200 dark:bg-zinc-700 rounded mb-10" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="pb-6 mb-6 border-b border-zinc-100 dark:border-zinc-700">
                <div className="h-4 w-3/4 bg-zinc-200 dark:bg-zinc-700 rounded mb-4" />
                <div className="flex gap-2">
                  {[...Array(10)].map((_, j) => (
                    <div key={j} className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-700" />
                  ))}
                </div>
              </div>
            ))}
            <div className="h-12 w-full bg-zinc-200 dark:bg-zinc-700 rounded-2xl mt-6" />
          </div>
        </main>
      </div>
    );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 pt-28 pb-12">
      <Navbar />
      <main className="max-w-2xl mx-auto p-6">
        <div className="bg-white dark:bg-zinc-800 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-700 shadow-sm">
          <h1 className="text-2xl font-black mb-2 text-center text-zinc-900 dark:text-zinc-100">
            Wypełnij ankietę
          </h1>
          <p className="text-center text-xs text-zinc-500 dark:text-zinc-400 mb-8">
            Skala 1–10 (1 = zdecydowanie nie, 10 = zdecydowanie tak)
          </p>

          <div className="space-y-8">
            {questions.map((q, index) => (
              <div key={q.id} className="pb-6 border-b border-zinc-100 dark:border-zinc-700">
                <div className="flex items-start gap-3 mb-4">
                  <span className="flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 font-black rounded-lg text-sm px-2.5 py-1 border border-indigo-100 dark:border-indigo-800 min-w-[32px] select-none">
                    {index + 1}
                  </span>
                  <p className="font-bold text-zinc-800 dark:text-zinc-100 pt-0.5">{q.content}</p>
                </div>

                {q.id === "A+" || q.id === "A-" ? (
                  <textarea
                    className="w-full p-4 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm"
                    placeholder="Wpisz swoją odpowiedź..."
                    value={answers[q.id] || ""}
                    onChange={(e) =>
                      setAnswers({ ...answers, [q.id]: e.target.value })
                    }
                  />
                ) : (
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 pl-11">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((r) => (
                      <button
                        key={r}
                        onClick={() => setAnswers({ ...answers, [q.id]: r })}
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full font-bold text-sm transition-all ${
                          answers[q.id] === r
                            ? "bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40"
                            : "bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {errorMsg && (
            <div className="mt-6 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-xs font-semibold text-red-700 dark:text-red-300">
              {errorMsg}
            </div>
          )}

          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={submitting || !isFormComplete}
            className="w-full mt-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl disabled:bg-zinc-300 dark:disabled:bg-zinc-700 disabled:cursor-not-allowed transition"
          >
            {submitting
              ? "Wysyłanie..."
              : !isFormComplete
                ? "Wypełnij wszystkie pola"
                : "Wyślij odpowiedzi"}
          </button>
        </div>
      </main>

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-800 rounded-3xl shadow-2xl max-w-md w-full p-8 border border-zinc-200 dark:border-zinc-700">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                <span className="text-3xl">?</span>
              </div>
            </div>
            <h2 className="text-xl font-black text-center text-zinc-900 dark:text-zinc-100 mb-2">
              Wysłać odpowiedzi?
            </h2>
            <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              Po wysłaniu nie będzie można już zmienić odpowiedzi. Upewnij się, że wszystko jest zaznaczone tak, jak chcesz.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 border border-zinc-200 dark:border-zinc-600 text-zinc-700 dark:text-zinc-200 rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-zinc-50 dark:hover:bg-zinc-700 transition"
              >
                Wróć
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold uppercase tracking-wider transition"
              >
                Wyślij
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-800 rounded-3xl shadow-2xl max-w-md w-full p-8 border border-zinc-200 dark:border-zinc-700">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                <span className="text-3xl">✓</span>
              </div>
            </div>
            <h2 className="text-xl font-black text-center text-zinc-900 dark:text-zinc-100 mb-2">
              Dziękujemy!
            </h2>
            <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              Twoje odpowiedzi zostały pomyślnie zapisane. Twoja opinia ma znaczenie 💜
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full py-3 bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white text-white rounded-xl text-sm font-bold uppercase tracking-wider transition-colors"
            >
              Powrót do panelu
            </button>
          </div>
        </div>
      )}

      {showAlreadyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-800 rounded-3xl shadow-2xl max-w-md w-full p-8 border border-zinc-200 dark:border-zinc-700">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                <span className="text-3xl">⚠</span>
              </div>
            </div>
            <h2 className="text-xl font-black text-center text-zinc-900 dark:text-zinc-100 mb-2">
              Ankieta już wypełniona
            </h2>
            <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mb-6">
              Wypełniłeś/aś już tę ankietę wcześniej. Można ją uzupełnić tylko raz.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full py-3 bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:text-zinc-900 text-white rounded-xl text-sm font-bold uppercase tracking-wider transition-colors"
            >
              Powrót do panelu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
