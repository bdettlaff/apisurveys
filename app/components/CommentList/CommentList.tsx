"use client";

interface CommentItem {
  text: string;
  questionText?: string;
}

interface CommentsStructure {
  positive: CommentItem[];
  constructive: CommentItem[];
  internal: CommentItem[];
}

interface Props {
  comments: CommentsStructure;
}

export function CommentList({ comments }: Props) {
  const totalCount =
    comments.positive.length + comments.constructive.length + comments.internal.length;

  return (
    <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-700 shadow-sm flex flex-col h-[520px]">
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-700 pb-4 mb-4">
        <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
          Opinie i uwagi uczniów
        </h2>
        <span className="text-[10px] font-bold bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 px-2 py-1 rounded-full uppercase tracking-wider">
          {totalCount} wpisów
        </span>
      </div>

      <div className="overflow-y-auto space-y-4 flex-1 pr-1 custom-scrollbar">
        {totalCount === 0 && (
          <p className="text-xs text-zinc-400 italic text-center py-8">
            Brak opinii do wyświetlenia.
          </p>
        )}

        {comments.positive.map((c, index) => (
          <div key={`pos-${index}`} className="p-4 bg-emerald-50/60 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                ✓ Pozytywna opinia
              </span>
            </div>
            {c.questionText && (
              <p className="text-[11px] font-semibold text-emerald-900/80 dark:text-emerald-300 uppercase tracking-wide mb-1.5">
                {c.questionText}
              </p>
            )}
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100 leading-relaxed">
              „{c.text}"
            </p>
          </div>
        ))}

        {comments.constructive.map((c, index) => (
          <div key={`con-${index}`} className="p-4 bg-amber-50/60 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                ✎ Sugestia zmian
              </span>
            </div>
            {c.questionText && (
              <p className="text-[11px] font-semibold text-amber-900/80 dark:text-amber-300 uppercase tracking-wide mb-1.5">
                {c.questionText}
              </p>
            )}
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100 leading-relaxed">
              „{c.text}"
            </p>
          </div>
        ))}

        {comments.internal.map((c, index) => (
          <div key={`int-${index}`} className="p-4 bg-rose-50/60 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                ⚑ Uwaga administracyjna
              </span>
            </div>
            {c.questionText && (
              <p className="text-[11px] font-semibold text-rose-900/80 dark:text-rose-300 uppercase tracking-wide mb-1.5">
                {c.questionText}
              </p>
            )}
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100 leading-relaxed">
              „{c.text}"
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
