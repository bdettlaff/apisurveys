"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMsal } from "@azure/msal-react";
import { Navbar } from "../../../components/Navbar/Navbar";
import { API_URL } from '@/lib/api'

type QuestionDTO = {
  id: string;
  content: string;
  type?: string;
};

type SurveySection = {
  surveyId: number;
  subjectName: string;
  questions: QuestionDTO[];
  isSchoolSection?: boolean;
};

type TeacherSurveyGroupDTO = {
  teacherId: number;
  teacherName: string;
  targetClass: string;
  startDate: string;
  endDate: string;
  sections: SurveySection[];
};

const COMMON_QUESTION_IDS = new Set([
  "A1",
  "A2",
  "A3",
  "A4",
  "A5",
  "A6",
  "A7",
  "A8",
  "A9",
  "A+",
  "A-",
]);
const SCHOOL_QUESTION_IDS = new Set(["B1", "B2", "B3", "B+"]);
const OPTIONAL_QUESTION_IDS = new Set(["A+", "A-", "B+"]);

const isOpenQuestion = (q: QuestionDTO): boolean => {
  if (q.type === "OPEN") return true;
  if (q.type === "SCALE") return false;
  return OPTIONAL_QUESTION_IDS.has(q.id);
};

type SharedSpecificQuestion = { question: QuestionDTO; surveyIds: number[] };
type UniqueSection = {
  surveyId: number;
  subjectName: string;
  questions: QuestionDTO[];
};
type SurveyStatus =
  | { type: "not_started"; startDate: Date }
  | { type: "expired"; endDate: Date }
  | { type: "active" };

function parseSurveyStatus(
  startDateStr: string,
  endDateStr: string,
): SurveyStatus {
  const now = new Date();
  const start = new Date(startDateStr + "T00:00:00");
  const end = new Date(endDateStr + "T23:59:59");
  if (now < start) return { type: "not_started", startDate: start };
  if (now > end) return { type: "expired", endDate: end };
  return { type: "active" };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function GroupSurveyPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { instance, accounts } = useMsal();

  const firstSurveyId = params.teacherId as string;
  const accessCode = searchParams.get("code") || "";
  const surveyIds = (searchParams.get("ids") || firstSurveyId)
    .split(",")
    .map(Number);

  const [group, setGroup] = useState<TeacherSurveyGroupDTO | null>(null);
  const [commonAnswers, setCommonAnswers] = useState<Record<string, any>>({});
  const [sharedSpecificAnswers, setSharedSpecificAnswers] = useState<
    Record<string, any>
  >({});
  const [uniqueAnswers, setUniqueAnswers] = useState<
    Record<number, Record<string, any>>
  >({});
  const [schoolAnswers, setSchoolAnswers] = useState<Record<string, any>>({});
  const [b3Selected, setB3Selected] = useState<Set<string>>(new Set());
  const [b3NoneSelected, setB3NoneSelected] = useState(false);
  const [fetchedSubjects, setFetchedSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showAlreadyModal, setShowAlreadyModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getAccessToken = useCallback(async () => {
    if (accounts.length === 0) throw new Error("Nie jesteś zalogowany.");
    const response = await instance.acquireTokenSilent({
      scopes: ["api://d5614add-3e17-42b6-a294-fc218d0f61e6/access_as_user"],
      account: accounts[0],
    });
    return response.accessToken;
  }, [instance, accounts]);

  useEffect(() => {
    async function loadGroup() {
      if (!firstSurveyId || !accessCode || accounts.length === 0) return;
      try {
        const token = await getAccessToken();
        const res = await fetch(
          `${API_URL}/api/surveys/group/${firstSurveyId}?ids=${surveyIds.join(",")}&code=${accessCode}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!res.ok) throw new Error(`Błąd API: ${res.status}`);
        const data: TeacherSurveyGroupDTO = await res.json();
        setGroup(data);
        const initial: Record<number, Record<string, any>> = {};
        data.sections.forEach((s) => {
          initial[s.surveyId] = {};
        });
        setUniqueAnswers(initial);
      } catch (err) {
        console.error("Błąd ładowania ankiet:", err);
      } finally {
        setLoading(false);
      }
    }
    loadGroup();
  }, [firstSurveyId, accessCode, accounts, getAccessToken]);

useEffect(() => {
  if (!accessCode) return;

  instance.acquireTokenSilent({
    scopes: ["api://d5614add-3e17-42b6-a294-fc218d0f61e6/access_as_user"],
    account: accounts[0],
  }).then((authResult) => {
    fetch(`${API_URL}/api/classes/subjects-by-code/${accessCode}`, {
      headers: {
        Authorization: `Bearer ${authResult.accessToken}`,
      },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: string[]) => setFetchedSubjects(data))
      .catch(() => setFetchedSubjects([]));
  });
}, [accessCode, instance, accounts]);

  const {
    commonQuestions,
    sharedSpecificQuestions,
    uniqueSections,
    schoolSection,
    teacherSectionIds,
    subjectList,
  } = useMemo(() => {
    if (!group)
      return {
        commonQuestions: [],
        sharedSpecificQuestions: [],
        uniqueSections: [],
        schoolSection: null,
        teacherSectionIds: [],
        subjectList: [],
      };

    const schoolSec =
      group.sections.find(
        (s) =>
          s.isSchoolSection ||
          s.questions.every((q) => SCHOOL_QUESTION_IDS.has(q.id)),
      ) ?? null;

    const teacherSections = group.sections.filter(
      (s) =>
        !s.isSchoolSection &&
        !s.questions.every((q) => SCHOOL_QUESTION_IDS.has(q.id)),
    );

    const subjects = Array.from(
      new Set(teacherSections.map((s) => s.subjectName).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b, "pl"));

    const commonMap = new Map<string, QuestionDTO>();
    teacherSections.forEach((s) => {
      s.questions.forEach((q) => {
        if (COMMON_QUESTION_IDS.has(q.id) && !commonMap.has(q.id))
          commonMap.set(q.id, q);
      });
    });

    const sectionsSpecific = teacherSections.map((s) => ({
      ...s,
      questions: s.questions.filter(
        (q) => !COMMON_QUESTION_IDS.has(q.id) && !SCHOOL_QUESTION_IDS.has(q.id),
      ),
    }));

    const qIdToSurveyIds = new Map<string, number[]>();
    const qIdToQuestion = new Map<string, QuestionDTO>();
    sectionsSpecific.forEach((s) => {
      s.questions.forEach((q) => {
        if (!qIdToSurveyIds.has(q.id)) {
          qIdToSurveyIds.set(q.id, []);
          qIdToQuestion.set(q.id, q);
        }
        qIdToSurveyIds.get(q.id)!.push(s.surveyId);
      });
    });

    const sharedQIds = new Set<string>();
    const sharedSpecific: SharedSpecificQuestion[] = [];
    qIdToSurveyIds.forEach((sIds, qId) => {
      if (sIds.length > 1) {
        sharedQIds.add(qId);
        sharedSpecific.push({
          question: qIdToQuestion.get(qId)!,
          surveyIds: sIds,
        });
      }
    });

    const uniqueSecs: UniqueSection[] = sectionsSpecific
      .map((s) => ({
        surveyId: s.surveyId,
        subjectName: s.subjectName,
        questions: s.questions.filter((q) => !sharedQIds.has(q.id)),
      }))
      .filter((s) => s.questions.length > 0);

    return {
      commonQuestions: Array.from(commonMap.values()),
      sharedSpecificQuestions: sharedSpecific,
      uniqueSections: uniqueSecs,
      schoolSection: schoolSec,
      teacherSectionIds: teacherSections.map((s) => s.surveyId),
      subjectList: subjects,
    };
  }, [group]);

  const surveyStatus = useMemo<SurveyStatus | null>(() => {
    if (!group) return null;
    return parseSurveyStatus(group.startDate, group.endDate);
  }, [group]);

  const isB3Complete = b3NoneSelected || b3Selected.size > 0;

  const isFormComplete = useCallback(() => {
    if (!group) return false;
    const commonOk = commonQuestions.every(
      (q) =>
        OPTIONAL_QUESTION_IDS.has(q.id) || commonAnswers[q.id] !== undefined,
    );
    const sharedOk = sharedSpecificQuestions.every(
      (sq) =>
        OPTIONAL_QUESTION_IDS.has(sq.question.id) ||
        sharedSpecificAnswers[sq.question.id] !== undefined,
    );
    const uniqueOk = uniqueSections.every((s) =>
      s.questions.every(
        (q) =>
          OPTIONAL_QUESTION_IDS.has(q.id) ||
          uniqueAnswers[s.surveyId]?.[q.id] !== undefined,
      ),
    );
    const schoolOk =
      !schoolSection ||
      schoolSection.questions.every((q) => {
        if (q.id === "B3") return isB3Complete;
        if (OPTIONAL_QUESTION_IDS.has(q.id)) return true;
        return schoolAnswers[q.id] !== undefined;
      });
    return commonOk && sharedOk && uniqueOk && schoolOk;
  }, [
    group,
    commonQuestions,
    commonAnswers,
    sharedSpecificQuestions,
    sharedSpecificAnswers,
    uniqueSections,
    uniqueAnswers,
    schoolSection,
    schoolAnswers,
    isB3Complete,
  ]);

  const setCommonAnswer = (qId: string, val: any) =>
    setCommonAnswers((p) => ({ ...p, [qId]: val }));
  const setSharedAnswer = (qId: string, val: any) =>
    setSharedSpecificAnswers((p) => ({ ...p, [qId]: val }));
  const setUniqueAnswer = (surveyId: number, qId: string, val: any) =>
    setUniqueAnswers((p) => ({
      ...p,
      [surveyId]: { ...(p[surveyId] || {}), [qId]: val },
    }));
  const setSchoolAnswer = (qId: string, val: any) =>
    setSchoolAnswers((p) => ({ ...p, [qId]: val }));

  const toggleB3Subject = (subject: string) => {
    setB3NoneSelected(false);
    setB3Selected((prev) => {
      const next = new Set(prev);
      next.has(subject) ? next.delete(subject) : next.add(subject);
      return next;
    });
  };
  const toggleB3None = () => {
    setB3NoneSelected((prev) => !prev);
    setB3Selected(new Set());
  };

  const handleSubmit = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const token = await getAccessToken();
      const teacherPayload: Record<number, Record<string, any>> = {};
      teacherSectionIds.forEach((surveyId, index) => {
        const isFirst = index === 0;
        const sharedForThis: Record<string, any> = {};
        sharedSpecificQuestions.forEach((sq) => {
          if (sq.surveyIds.includes(surveyId))
            sharedForThis[sq.question.id] =
              sharedSpecificAnswers[sq.question.id];
        });
        const uniqueForThis = uniqueAnswers[surveyId] || {};
        teacherPayload[surveyId] = isFirst
          ? { ...commonAnswers, ...sharedForThis, ...uniqueForThis }
          : { ...sharedForThis, ...uniqueForThis };
      });

      const b3Value = b3NoneSelected
        ? "żaden"
        : Array.from(b3Selected).join(", ");
      const schoolPayload: Record<number, Record<string, any>> = {};
      if (schoolSection)
        schoolPayload[schoolSection.surveyId] = {
          ...schoolAnswers,
          B3: b3Value,
        };

      const response = await fetch(
        `${API_URL}/api/surveys/group/submit`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...teacherPayload, ...schoolPayload }),
        },
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

  let _counter = 0;

  const renderB3Question = (q: QuestionDTO) => {
    _counter++;
    const idx = _counter;
    return (
      <div key={q.id} className="pb-6 border-b border-zinc-100 last:border-0">
        <div className="flex items-start gap-3 mb-4">
          <span className="flex items-center justify-center bg-indigo-50 text-indigo-600 font-black rounded-lg text-sm px-2.5 py-1 border border-indigo-100 min-w-[32px] select-none">
            {idx}
          </span>
          <p className="font-bold text-zinc-800 pt-0.5">{q.content}</p>
        </div>
        <div className="pl-11 flex flex-wrap gap-2">
          {(subjectList.length > 0 ? subjectList : fetchedSubjects).map(
            (subject) => {
              const isChecked = b3Selected.has(subject);
              return (
                <button
                  key={subject}
                  onClick={() => toggleB3Subject(subject)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    isChecked
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200"
                      : "bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200"
                  }`}
                >
                  {subject}
                </button>
              );
            },
          )}
          <button
            onClick={toggleB3None}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              b3NoneSelected
                ? "bg-zinc-800 text-white border-zinc-800 shadow-md"
                : "bg-zinc-100 text-zinc-500 border-zinc-200 hover:bg-zinc-200"
            }`}
          >
            Żaden
          </button>
        </div>
        {!isB3Complete && (
          <p className="pl-11 mt-2 text-xs text-amber-600 font-medium">
            Wybierz co najmniej jeden przedmiot lub "Żaden"
          </p>
        )}
      </div>
    );
  };

  const renderQuestion = (
    q: QuestionDTO,
    currentAnswer: any,
    onAnswer: (value: any) => void,
  ) => {
    if (q.id === "B3") return renderB3Question(q);

    _counter++;
    const idx = _counter;
    const isOptional = OPTIONAL_QUESTION_IDS.has(q.id);
    const isOpen = isOpenQuestion(q);

    return (
      <div key={q.id} className="pb-6 border-b border-zinc-100 last:border-0">
        <div className="flex items-start gap-3 mb-4">
          <span className="flex items-center justify-center bg-indigo-50 text-indigo-600 font-black rounded-lg text-sm px-2.5 py-1 border border-indigo-100 min-w-[32px] select-none">
            {idx}
          </span>
          <p className="font-bold text-zinc-800 pt-0.5">
            {q.content}
            {isOptional && (
              <span className="ml-2 text-xs font-normal text-zinc-400">
                (opcjonalne)
              </span>
            )}
          </p>
        </div>

        {/* Wcięcie wyrównane z tekstem pytania (pl-11 = 2.75rem = szerokość numeru + gap) */}
        <div className="pl-11">
          {isOpen ? (
            <textarea
              className="w-full p-4 border border-zinc-200 rounded-xl bg-zinc-50 focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm resize-none"
              rows={3}
              placeholder={
                isOptional
                  ? "Wpisz swoją odpowiedź (opcjonalnie)..."
                  : "Wpisz swoją odpowiedź..."
              }
              value={currentAnswer || ""}
              onChange={(e) => onAnswer(e.target.value || undefined)}
            />
          ) : (
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {[1, 2, 3, 4, 5].map((r) => (
                <button
                  key={r}
                  onClick={() => onAnswer(r)}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full font-bold text-sm transition-all ${
                    currentAnswer === r
                      ? "bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-200"
                      : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSectionHeader = (
    label: string,
    color: "zinc" | "indigo" | "emerald",
  ) => {
    const styles = {
      zinc: "bg-zinc-100 text-zinc-600 border-zinc-200",
      indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
      emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    }[color];
    return (
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-zinc-200" />
        <span
          className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded-full border ${styles}`}
        >
          {label}
        </span>
        <div className="flex-1 h-px bg-zinc-200" />
      </div>
    );
  };

  if (loading)
    return (
      <div className="min-h-screen bg-zinc-50 pt-28 pb-12">
        <Navbar />
        <main className="max-w-2xl mx-auto p-6">
          <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm animate-pulse">
            <div className="h-8 w-1/2 mx-auto bg-zinc-200 rounded mb-10" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="mb-8">
                <div className="h-5 w-1/3 bg-zinc-200 rounded mb-4" />
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="pb-6 mb-4 border-b border-zinc-100">
                    <div className="h-4 w-3/4 bg-zinc-200 rounded mb-4" />
                    <div className="flex gap-2">
                      {[...Array(5)].map((_, k) => (
                        <div
                          key={k}
                          className="w-9 h-9 rounded-full bg-zinc-100"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </main>
      </div>
    );

  if (!group) return null;

  if (surveyStatus && surveyStatus.type !== "active") {
    const isNotStarted = surveyStatus.type === "not_started";
    return (
      <div className="min-h-screen bg-zinc-50 pt-28 pb-12">
        <Navbar />
        <main className="max-w-2xl mx-auto p-6">
          <div className="bg-white p-10 rounded-3xl border border-zinc-200 shadow-sm text-center">
            <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center text-3xl bg-amber-100">
              {isNotStarted ? "🕐" : "🔒"}
            </div>
            <h1 className="text-xl font-black text-zinc-900 mb-2">
              {isNotStarted
                ? "Ankieta jeszcze nieaktywna"
                : "Ankieta zakończona"}
            </h1>
            <p className="text-sm text-zinc-500 mb-6">
              {isNotStarted ? (
                <>
                  Ankieta będzie dostępna od{" "}
                  <span className="font-bold text-zinc-700">
                    {formatDate((surveyStatus as any).startDate)}
                  </span>
                  .
                </>
              ) : (
                <>
                  Ankieta była aktywna do{" "}
                  <span className="font-bold text-zinc-700">
                    {formatDate((surveyStatus as any).endDate)}
                  </span>
                  . Czas na odpowiedzi minął.
                </>
              )}
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-3 bg-zinc-900 hover:bg-black text-white rounded-xl text-sm font-bold uppercase tracking-wider transition-colors"
            >
              Powrót do panelu
            </button>
          </div>
        </main>
      </div>
    );
  }

  _counter = 0;

  return (
    <div className="min-h-screen bg-zinc-50 pt-28 pb-12">
      <Navbar />
      <main className="max-w-2xl mx-auto p-6">
        <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
          <h1 className="text-2xl font-black mb-1 text-center text-zinc-900">
            {group.teacherName}
          </h1>
          <p className="text-center text-sm text-zinc-500 mb-1">
            {group.targetClass}
          </p>
          <p className="text-center text-xs text-zinc-400 mb-1">
            Skala 1–5 (1 = zdecydowanie nie, 5 = zdecydowanie tak)
          </p>
          <p className="text-center text-xs text-zinc-300 mb-8">
            Ankieta aktywna do{" "}
            {formatDate(new Date(group.endDate + "T23:59:59"))}
          </p>

          <div className="space-y-10">
            {commonQuestions.length > 0 && (
              <div>
                {renderSectionHeader("Pytania ogólne", "zinc")}
                <div className="space-y-8">
                  {commonQuestions.map((q) =>
                    renderQuestion(q, commonAnswers[q.id], (val) =>
                      setCommonAnswer(q.id, val),
                    ),
                  )}
                </div>
              </div>
            )}

            {sharedSpecificQuestions.length > 0 && (
              <div>
                {renderSectionHeader("Pytania przedmiotowe", "indigo")}
                <div className="space-y-8">
                  {sharedSpecificQuestions.map((sq) =>
                    renderQuestion(
                      sq.question,
                      sharedSpecificAnswers[sq.question.id],
                      (val) => setSharedAnswer(sq.question.id, val),
                    ),
                  )}
                </div>
              </div>
            )}

            {uniqueSections.map((section) => (
              <div key={section.surveyId}>
                {renderSectionHeader(section.subjectName, "indigo")}
                <div className="space-y-8">
                  {section.questions.map((q) =>
                    renderQuestion(
                      q,
                      uniqueAnswers[section.surveyId]?.[q.id],
                      (val) => setUniqueAnswer(section.surveyId, q.id, val),
                    ),
                  )}
                </div>
              </div>
            ))}

            {schoolSection && schoolSection.questions.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex-1 h-px bg-zinc-200" />
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-wider rounded-full border border-emerald-100">
                    Ocena szkoły
                  </span>
                  <div className="flex-1 h-px bg-zinc-200" />
                </div>
                <p className="text-center text-xs text-zinc-400 mb-6">
                  Poniższe pytania dotyczą całej szkoły, nie konkretnego
                  nauczyciela
                </p>
                <div className="space-y-8">
                  {schoolSection.questions.map((q) =>
                    renderQuestion(q, schoolAnswers[q.id], (val) =>
                      setSchoolAnswer(q.id, val),
                    ),
                  )}
                </div>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">
              {errorMsg}
            </div>
          )}

          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={submitting || !isFormComplete()}
            className="w-full mt-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl disabled:bg-zinc-300 disabled:cursor-not-allowed transition"
          >
            {submitting
              ? "Wysyłanie..."
              : !isFormComplete()
                ? "Wypełnij wszystkie pola"
                : "Wyślij odpowiedzi"}
          </button>
        </div>
      </main>

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border border-zinc-200">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-3xl">?</span>
              </div>
            </div>
            <h2 className="text-xl font-black text-center text-zinc-900 mb-2">
              Wysłać odpowiedzi?
            </h2>
            <p className="text-center text-sm text-zinc-500 mb-6">
              Po wysłaniu nie będzie można już zmienić odpowiedzi.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 border border-zinc-200 text-zinc-700 rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-zinc-50 transition"
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
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border border-zinc-200">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="text-3xl">✓</span>
              </div>
            </div>
            <h2 className="text-xl font-black text-center text-zinc-900 mb-2">
              Dziękujemy!
            </h2>
            <p className="text-center text-sm text-zinc-500 mb-6">
              Twoje odpowiedzi zostały pomyślnie zapisane. Twoja opinia ma
              znaczenie 💜
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full py-3 bg-zinc-900 hover:bg-black text-white rounded-xl text-sm font-bold uppercase tracking-wider transition-colors"
            >
              Powrót do panelu
            </button>
          </div>
        </div>
      )}

      {showAlreadyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border border-zinc-200">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                <span className="text-3xl">⚠</span>
              </div>
            </div>
            <h2 className="text-xl font-black text-center text-zinc-900 mb-2">
              Ankieta już wypełniona
            </h2>
            <p className="text-center text-sm text-zinc-500 mb-6">
              Wypełniłeś/aś już tę ankietę wcześniej. Można ją uzupełnić tylko
              raz.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full py-3 bg-zinc-900 hover:bg-black text-white rounded-xl text-sm font-bold uppercase tracking-wider transition-colors"
            >
              Powrót do panelu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
