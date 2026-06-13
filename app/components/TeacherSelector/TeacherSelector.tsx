"use client";

interface TeacherOption {
  teacherId: string;
  teacherName: string;
}

interface Props {
  subjects: string[];
  selectedSubject: string;
  onSubjectChange: (subject: string) => void;
  teachers: TeacherOption[];
  selectedTeacherId: string;
  onTeacherChange: (id: string) => void;
}

export function TeacherSelector({
  subjects,
  selectedSubject,
  onSubjectChange,
  teachers,
  selectedTeacherId,
  onTeacherChange,
}: Props) {
  const selectStyle = {
    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%234b5563' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    backgroundSize: "16px",
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
      <div className="w-full sm:w-56">
        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
          Filtruj po przedmiocie
        </label>
        <select
          value={selectedSubject}
          onChange={(e) => onSubjectChange(e.target.value)}
          className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-bold text-zinc-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer appearance-none"
          style={selectStyle}
        >
          {subjects.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>
      </div>

      <div className="w-full sm:w-64">
        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
          Wybierz nauczyciela
        </label>
        <select
          value={selectedTeacherId}
          onChange={(e) => onTeacherChange(e.target.value)}
          className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-bold text-zinc-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer appearance-none"
          style={selectStyle}
        >
          <option value="all">Wszyscy nauczyciele</option>
            {teachers
              .slice()
              .sort((a, b) => {
                const lastName = (name) => name.trim().split(' ').at(-1);
                return lastName(a.teacherName).localeCompare(lastName(b.teacherName), 'pl');
              })
              .map((teacher) => (
                <option key={teacher.teacherId} value={teacher.teacherId}>
                  {teacher.teacherName}
                </option>
              ))}
        </select>
      </div>
    </div>
  );
}
