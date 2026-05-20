"use client";

import React, { useState, useEffect } from "react";

interface Teacher {
  id: number;
  firstName: string;
  lastName: string;
}

interface Subject {
  id: number;
  name: string;
  moduleType: string;
}

interface EvaluationBlock {
  id: string;
  teacher: Teacher;
  subject: Subject;
}

interface SurveyContext {
  classId: string;
  slug: string;
  blocks: EvaluationBlock[];
}

interface SurveyFormProps {
  slug: string;
}

export default function SurveyForm({ slug }: SurveyFormProps) {
  const [context, setContext] = useState<SurveyContext | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [answersMap, setAnswersMap] = useState<Record<string, Record<string, any>>>({});

  const generalQuestions = [
    { id: "A1", text: "Jak ogólnie oceniasz te zajęcia?" },
    { id: "A2", text: "Nauczyciel/ka jasno i zrozumiale tłumaczy nowy materiał." },
    { id: "A3", text: "Tempo zajęć jest dostosowane do możliwości uczniów." },
    { id: "A4", text: "Ocenianie jest sprawiedliwe i zrozumiałe." },
    { id: "A5", text: "Na tych zajęciach czuję się bezpiecznie." },
  ];

  useEffect(() => {
    async function fetchSurveyData() {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:8080/api/surveys/start/${slug}`);
        if (!res.ok) throw new Error("Nie udało się pobrać danych ankiety.");
        
        const data: SurveyContext = await res.json();
        setContext(data);

        let initialAnswers: Record<string, Record<string, any>> = {};
        data.blocks.forEach((block) => {
          const blockKey = `${block.teacher.id}_${block.subject.id}`;
          initialAnswers[blockKey] = {
            "A+": "",
            "A-": ""
          };
        });
        
        setAnswersMap(initialAnswers);
      } catch (err: any) {
        setError(err.message || "Wystąpił błąd");
      } finally {
        setLoading(false);
      }
    }

    fetchSurveyData();
  }, [slug]);

  const handleScoreChange = (blockKey: string, questionId: string, score: number) => {
    setAnswersMap((prev) => ({
      ...prev,
      [blockKey]: {
        ...prev[blockKey],
        [questionId]: score,
      },
    }));
  };

  const handleCommentChange = (blockKey: string, questionId: string, text: string) => {
    setAnswersMap((prev) => ({
      ...prev,
      [blockKey]: {
        ...prev[blockKey],
        [questionId]: text,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!context) return;

    for (const block of context.blocks) {
      const blockKey = `${block.teacher.id}_${block.subject.id}`;
      const blockAnswers = answersMap[blockKey] || {};
      
      const missingAnswer = generalQuestions.some((q) => !blockAnswers[q.id]);
      if (missingAnswer) {
        alert(`Proszę uzupełnić wszystkie oceny dla: ${block.teacher.firstName} ${block.teacher.lastName} - ${block.subject.name}`);
        return;
      }
    }

    const payload = {
      classId: context.classId,
      year: 2026,
      blockAnswers: Object.keys(answersMap).map((key) => {
        const [teacherId, subjectId] = key.split("_");
        const questionsData = answersMap[key];

        const answers = Object.keys(questionsData).map((qId) => ({
          questionId: qId,
          score: typeof questionsData[qId] === "number" ? questionsData[qId] : null,
          comment: typeof questionsData[qId] === "string" ? questionsData[qId] : null,
        }));

        return {
          teacherId: parseInt(teacherId),
          subjectId: parseInt(subjectId),
          answers: answers,
        };
      }),
      finalAnswers: []
    };

    try {
      const response = await fetch("http://localhost:8080/api/surveys/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert("Ankieta została wysłana pomyślnie i w pełni anonimowo!");
      } else {
        alert("Wystąpił błąd podczas wysyłania ankiety.");
      }
    } catch (error) {
      console.error("Błąd wysyłki:", error);
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-600">Ładowanie bloków oceniania...</div>;
  if (error) return <div className="p-6 text-center text-red-500">Błąd: {error}</div>;
  if (!context || context.blocks.length === 0) return <div className="p-6 text-center">Brak przypisanych nauczycieli dla tej klasy.</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      <header className="mb-8 border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-800">Panel Ewaluacji Zajęć</h1>
        <p className="text-sm text-gray-600">Klasa: <span className="font-semibold">{context.classId}</span> | Rok szkolny: 2025/2026</p>
        <p className="text-xs text-red-500 mt-1">* Wszystkie bloki oceny są obowiązkowe.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        {context.blocks.map((block, index) => {
          const blockKey = `${block.teacher.id}_${block.subject.id}`;
          const currentBlockAnswers = answersMap[blockKey] || {};

          return (
            <div key={block.id} className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="mb-4 bg-blue-50 p-3 rounded border-l-4 border-blue-500">
                <h2 className="text-lg font-bold text-gray-900">
                  {index + 1}. {block.teacher.firstName} {block.teacher.lastName}
                </h2>
                <p className="text-sm text-gray-700 font-medium capitalize">
                  Przedmiot: {block.subject.name} ({block.subject.moduleType})
                </p>
              </div>

              <div className="space-y-4 my-6">
                {generalQuestions.map((question) => (
                  <div key={question.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-100 gap-2">
                    <span className="text-sm text-gray-800 max-w-md">{question.id}. {question.text}</span>
                    
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => handleScoreChange(blockKey, question.id, score)}
                          className={`w-10 h-10 rounded-full font-semibold border text-sm transition-all ${
                            currentBlockAnswers[question.id] === score
                              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                              : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-300"
                          }`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-bold text-green-700 mb-1">A+. Co najbardziej cenisz na tych zajęciach?</label>
                  <textarea
                    rows={2}
                    value={currentBlockAnswers["A+"] || ""}
                    onChange={(e) => handleCommentChange(blockKey, "A+", e.target.value)}
                    placeholder="Wpisz opcjonalną pochwałę..."
                    className="w-full p-2 border rounded text-sm bg-green-50/30 focus:ring-1 focus:ring-green-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-red-700 mb-1">A−. Co chciałbyś/chciałabyś zmienić lub poprawić?</label>
                  <textarea
                    rows={2}
                    value={currentBlockAnswers["A-"] || ""}
                    onChange={(e) => handleCommentChange(blockKey, "A-", e.target.value)}
                    placeholder="Wpisz opcjonalną uwagę..."
                    className="w-full p-2 border rounded text-sm bg-red-50/30 focus:ring-1 focus:ring-red-500 outline-none"
                  />
                </div>
              </div>
            </div>
          );
        })}

        <div className="pt-4">
          <button
            type="submit"
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow transition-colors text-center"
          >
            Zatwierdź i wyślij całą ankietę
          </button>
        </div>
      </form>
    </div>
  );
}