// exportToExcel.ts — eksport wyników ankiet do pliku Excel
// Używa biblioteki SheetJS (xlsx) dostępnej w projekcie Next.js
// Wywołaj: exportResultsToExcel(teacherData, schoolData, questionTexts)

import * as XLSX from "xlsx";

type CommentDTO = { text: string; type: string; questionText: string };

type TeacherResult = {
  teacherId: number;
  teacherName: string;
  subjectName: string | null;
  totalVotes: number;
  totalVotesPerClass: Record<string, number> | null;
  averages: Record<string, number> | null;
  averagesPerClass: Record<string, Record<string, number>> | null;
  comments: CommentDTO[] | null;
  commentsPerClass: Record<string, CommentDTO[]> | null;
  classNames: string[];
  questionTexts: Record<string, string>;
  b3AnswersPerClass: Record<string, string[]> | null;
};

// Kolejność pytań A–Z zgodna z indeksem ankiety
const QUESTION_ORDER = [
  "A1",
  "A2",
  "A3",
  "A4",
  "A5",
  "A6",
  "A7",
  "A8",
  "A9",
  "L1",
  "L4",
  "S1",
  "S2",
  "S3",
  "P1",
  "P2",
  "P3",
  "W2",
  "W3",
  "Z1",
  "Z2",
  "ZP3",
  "ZP4",
  "ZL3",
  "ZL4",
  "Z5a",
  "Z5b",
  "B1",
  "B2",
];

// Zwraca posortowane klucze avg* z danych
function getSortedAvgKeys(averages: Record<string, number>): string[] {
  return QUESTION_ORDER.map((id) => "avg" + id).filter(
    (key) => key in averages,
  );
}

// Buduje wiersz nagłówków: Nauczyciel | Przedmiot | Klasa | Odpowiedzi | pytanie1 | pytanie2 ...
function buildHeaderRow(
  avgKeys: string[],
  questionTexts: Record<string, string>,
): string[] {
  const questionLabels = avgKeys.map((key) => {
    const id = key.replace("avg", "");
    const text = questionTexts[id] || id;
    // Skrócony label: ID + pierwsze słowa pytania
    const short = text.length > 40 ? text.substring(0, 37) + "..." : text;
    return `${id}: ${short}`;
  });
  return [
    "Nauczyciel",
    "Przedmiot",
    "Klasa",
    "Liczba odpowiedzi",
    ...questionLabels,
  ];
}

// Buduje wiersz danych dla nauczyciela/klasy
function buildDataRow(
  teacherName: string,
  subjectName: string | null,
  className: string,
  votes: number,
  averages: Record<string, number> | null,
  avgKeys: string[],
): (string | number)[] {
  const scores = avgKeys.map((key) => {
    const val = averages?.[key];
    return val !== undefined ? Math.round(val * 100) / 100 : "";
  });
  return [teacherName, subjectName || "—", className, votes, ...scores];
}

export function exportResultsToExcel(
  teacherData: TeacherResult[],
  schoolData: TeacherResult[],
  fileName = "wyniki_ankiet.xlsx",
): void {
  const wb = XLSX.utils.book_new();

  // Zbierz wszystkie klasy
  const allClasses = Array.from(
    new Set([
      ...teacherData.flatMap((t) => t.classNames || []),
      ...schoolData.flatMap((s) => s.classNames || []),
    ]),
  ).sort((a, b) => a.localeCompare(b, "pl"));

  // Zbierz questionTexts (z pierwszego nauczyciela który je ma)
  const questionTexts: Record<string, string> =
    teacherData.find((t) => t.questionTexts)?.questionTexts ||
    schoolData.find((s) => s.questionTexts)?.questionTexts ||
    {};

  // Zbierz wszystkie klucze avg które występują w danych
  const allAvgKeys = Array.from(
    new Set([
      ...teacherData.flatMap((t) => Object.keys(t.averages || {})),
      ...schoolData.flatMap((s) => Object.keys(s.averages || {})),
    ]),
  );
  const sortedAvgKeys = getSortedAvgKeys(
    Object.fromEntries(allAvgKeys.map((k) => [k, 0])),
  );

  // ── Arkusz 1: Wyniki ogólne ───────────────────────────────────────────────
  const overallRows: (string | number)[][] = [];
  const headerRow = buildHeaderRow(sortedAvgKeys, questionTexts);
  overallRows.push(headerRow);

  // Nauczyciele — wiersz per nauczyciel (ogólnie, wszystkie klasy)
  const activeTeachers = teacherData.filter((t) => (t.totalVotes ?? 0) > 0);
  activeTeachers
    .sort((a, b) => a.teacherName.localeCompare(b.teacherName, "pl"))
    .forEach((t) => {
      overallRows.push(
        buildDataRow(
          t.teacherName,
          t.subjectName,
          "Wszystkie klasy",
          t.totalVotes,
          t.averages,
          sortedAvgKeys,
        ),
      );
    });

  // Separator
  overallRows.push([]);

  // Szkoła — wiersz ogólny
  schoolData.forEach((s) => {
    if ((s.totalVotes ?? 0) > 0) {
      overallRows.push(
        buildDataRow(
          "Ocena szkoły",
          null,
          "Wszystkie klasy",
          s.totalVotes,
          s.averages,
          sortedAvgKeys,
        ),
      );
    }
  });

  const wsOverall = XLSX.utils.aoa_to_sheet(overallRows);
  applySheetStyles(wsOverall, overallRows.length, sortedAvgKeys.length + 4);
  XLSX.utils.book_append_sheet(wb, wsOverall, "Wyniki ogólne");

  // ── Arkusz per klasa ──────────────────────────────────────────────────────
  allClasses.forEach((className) => {
    const rows: (string | number)[][] = [];
    rows.push(headerRow);

    // Nauczyciele w tej klasie
    const teachersInClass = activeTeachers.filter((t) =>
      (t.classNames || []).includes(className),
    );

    teachersInClass
      .sort((a, b) => a.teacherName.localeCompare(b.teacherName, "pl"))
      .forEach((t) => {
        const votes = t.totalVotesPerClass?.[className] ?? 0;
        if (votes === 0) return;
        rows.push(
          buildDataRow(
            t.teacherName,
            t.subjectName,
            className,
            votes,
            t.averagesPerClass?.[className] ?? null,
            sortedAvgKeys,
          ),
        );
      });

    // Separator
    rows.push([]);

    // Szkoła w tej klasie
    schoolData.forEach((s) => {
      const votes = s.totalVotesPerClass?.[className] ?? 0;
      if (votes > 0) {
        rows.push(
          buildDataRow(
            "Ocena szkoły",
            null,
            className,
            votes,
            s.averagesPerClass?.[className] ?? null,
            sortedAvgKeys,
          ),
        );
      }
    });

    // B3 — przedmioty wymagające wsparcia
    const b3Answers = schoolData.flatMap(
      (s) => s.b3AnswersPerClass?.[className] || [],
    );
    if (b3Answers.length > 0) {
      rows.push([]);
      rows.push([
        "Przedmioty wymagające wsparcia (B3)",
        "",
        "",
        "Liczba wskazań",
      ]);
      const counts: Record<string, number> = {};
      b3Answers.forEach((answer) => {
        answer
          .split(",")
          .map((s) => s.trim())
          .forEach((subj) => {
            counts[subj] = (counts[subj] || 0) + 1;
          });
      });
      Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .forEach(([subj, count]) => {
          rows.push([subj, "", "", count]);
        });
    }

    // Komentarze nauczycielskie per klasa
    const teacherComments: {
      teacher: string;
      type: string;
      question: string;
      text: string;
    }[] = [];
    teachersInClass.forEach((t) => {
      const cls = t.commentsPerClass?.[className] || [];
      cls.forEach((c) => {
        teacherComments.push({
          teacher: t.teacherName,
          type: c.type === "POZYTYWNA" ? "Pozytywna" : "Konstruktywna",
          question: c.questionText,
          text: c.text,
        });
      });
    });

    if (teacherComments.length > 0) {
      rows.push([]);
      rows.push(["Komentarze", "Typ", "Pytanie", "Treść"]);
      teacherComments.forEach((c) => {
        rows.push([c.teacher, c.type, c.question, c.text]);
      });
    }

    // Komentarze szkolne (B+)
    const schoolComments = schoolData.flatMap(
      (s) => s.commentsPerClass?.[className] || [],
    );
    if (schoolComments.length > 0) {
      rows.push([]);
      rows.push(["Komentarze szkolne (B+)", "Typ", "Pytanie", "Treść"]);
      schoolComments.forEach((c) => {
        rows.push(["Ocena szkoły", c.type, c.questionText, c.text]);
      });
    }

    if (rows.length > 1) {
      const ws = XLSX.utils.aoa_to_sheet(rows);
      applySheetStyles(ws, rows.length, sortedAvgKeys.length + 4);
      // Nazwa arkusza max 31 znaków (limit Excel)
      const sheetName = className.substring(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    }
  });

  XLSX.writeFile(wb, fileName);
}

// Proste style: nagłówek pogrubiony + szerokości kolumn
function applySheetStyles(ws: XLSX.WorkSheet, _rows: number, cols: number) {
  // Szerokości kolumn
  const colWidths: { wch: number }[] = [
    { wch: 28 }, // Nauczyciel
    { wch: 22 }, // Przedmiot
    { wch: 16 }, // Klasa
    { wch: 18 }, // Odpowiedzi
  ];
  for (let i = 4; i < cols; i++) {
    colWidths.push({ wch: 14 });
  }
  ws["!cols"] = colWidths;
}
