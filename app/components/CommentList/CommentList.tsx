"use client";

interface CommentsStructure {
  positive: string[];
  constructive: string[];
  internal: string[];
}

interface Props {
  comments: CommentsStructure;
}

export function CommentList({ comments }: Props) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex flex-col h-[520px]">
      <h2 className="text-lg font-black text-zinc-900 tracking-tight border-b border-zinc-100 pb-4 mb-4">
        Opinie i uwagi uczniów
      </h2>

      <div className="overflow-y-auto space-y-4 flex-1 pr-1 custom-scrollbar">
        {comments.positive.map((comment, index) => (
          <div
            key={`pos-${index}`}
            className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-xl"
          >
            <span className="inline-flex items-center rounded-lg bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-2">
              Pozytywna (A+)
            </span>
            <p className="text-sm font-medium text-zinc-700 leading-relaxed">
              {comment}
            </p>
          </div>
        ))}

        {comments.constructive.map((comment, index) => (
          <div
            key={`con-${index}`}
            className="p-4 bg-amber-50/60 border border-amber-100 rounded-xl"
          >
            <span className="inline-flex items-center rounded-lg bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-2">
              Konstruktywna (A-)
            </span>
            <p className="text-sm font-medium text-zinc-700 leading-relaxed">
              {comment}
            </p>
          </div>
        ))}

        {comments.internal.map((comment, index) => (
          <div
            key={`int-${index}`}
            className="p-4 bg-rose-50/60 border border-rose-100 rounded-xl"
          >
            <span className="inline-flex items-center rounded-lg bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold text-rose-800 uppercase tracking-wider mb-2">
              Uwagi administracyjne (B+)
            </span>
            <p className="text-sm font-medium text-zinc-700 leading-relaxed">
              {comment}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
