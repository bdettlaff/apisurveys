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
          {
            headers: { Authorization: `Bearer ${token}` },
          },
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
    setSubmitting(true);

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
        },
      );

      if (response.status === 409) {
        alert("Już wypełniłeś tę ankietę!");
        window.location.href = "/dashboard";
        return;
      }

      if (!response.ok) throw new Error("Wystąpił błąd podczas wysyłania.");

      alert("Dziękujemy! Odpowiedzi zostały zapisane.");
      window.location.href = "/dashboard";
    } catch (err: any) {
      alert("Błąd: " + err.message);
      window.location.href = "/dashboard";
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="p-20 text-center font-bold">Ładowanie ankiety...</div>
    );

  return (
    <div className="min-h-screen bg-zinc-50 pt-28 pb-12">
      <Navbar />
      <main className="max-w-2xl mx-auto p-6">
        <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
          <h1 className="text-2xl font-black mb-8 text-center">Wypełnij ankietę</h1>

          <div className="space-y-8">
            {questions.map((q, index) => (
              <div key={q.id} className="pb-6 border-b border-zinc-100">
                <div className="flex items-start gap-3 mb-4">
                  <span className="flex items-center justify-center bg-indigo-50 text-indigo-600 font-black rounded-lg text-sm px-2.5 py-1 border border-indigo-100 min-w-[32px] select-none">
                    {index + 1}
                  </span>
                  <p className="font-bold text-zinc-800 pt-0.5">{q.content}</p>
                </div>

                {q.id === "A+" || q.id === "A-" ? (
                  <textarea
                    className="w-full p-4 border border-zinc-200 rounded-xl bg-zinc-50 focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm"
                    placeholder="Wpisz swoją odpowiedź..."
                    value={answers[q.id] || ""}
                    onChange={(e) =>
                      setAnswers({ ...answers, [q.id]: e.target.value })
                    }
                  />
                ) : (
                  <div className="flex justify-between max-w-md pl-11">
                    {[1, 2, 3, 4, 5].map((r) => (
                      <button
                        key={r}
                        onClick={() => setAnswers({ ...answers, [q.id]: r })}
                        className={`w-10 h-10 rounded-full font-bold transition-all ${
                          answers[q.id] === r
                            ? "bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-100"
                            : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
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

          <button
            onClick={handleSubmit}
            disabled={submitting || !isFormComplete}
            className="w-full mt-10 py-4 bg-indigo-600 text-white font-black rounded-2xl disabled:bg-zinc-300 disabled:cursor-not-allowed transition"
          >
            {submitting
              ? "Wysyłanie..."
              : !isFormComplete
                ? "Wypełnij wszystkie pola"
                : "Wyślij odpowiedzi"}
          </button>
        </div>
      </main>
    </div>
  );
}