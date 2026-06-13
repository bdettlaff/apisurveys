"use client";

import { useId } from "react";

interface StatItem {
  avg: number;
  label: string;
}

interface StatsProps {
  stats: Record<string, StatItem>;
  totalVotes: number;
  questionTexts?: Record<string, string>;
}

// kolory: zielony / indygo / bursztynowy / czerwony (skala 1-10)
function getColor(avg: number) {
  if (avg >= 4) return { bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" };
  if (avg >= 3) return { bar: "bg-indigo-600", text: "text-indigo-600 dark:text-indigo-400" };
  if (avg >= 2) return { bar: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" };
  return { bar: "bg-rose-500", text: "text-rose-600 dark:text-rose-400" };
}

export function StatsChart({ stats, totalVotes, questionTexts = {} }: StatsProps) {
  const baseId = useId().replace(/:/g, "");

  return (
    <div key={JSON.stringify(stats)} className="space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-700 pb-4">
        <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">
          Szczegółowa ocena
        </h3>
        <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-700/50 px-3 py-1.5 rounded-lg border border-zinc-100 dark:border-zinc-700">
          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">
            Głosów:
          </span>
          <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
            {totalVotes}
          </span>
        </div>
      </div>

      {Object.entries(stats)
        .sort(([keyA], [keyB]) => {
          const cleanA = keyA.replace("avg", "");
          const cleanB = keyB.replace("avg", "");
          return cleanA.localeCompare(cleanB, undefined, { numeric: true, sensitivity: "base" });
        })
        .map(([key, item]) => {
          const cleanKey = key.replace("avg", "");
          const questionText = questionTexts[cleanKey] || item.label;
          const scale = Math.min(item.avg / 5, 1);
          const barId = `bar_${baseId}_${key}`;
          const color = getColor(item.avg);

          return (
            <div key={key} className="space-y-2">
              <style>
                {`
                  @keyframes ${barId}_kf {
                    from { transform: scaleX(0); }
                    to { transform: scaleX(${scale}); }
                  }
                  #${barId} {
                    animation: ${barId}_kf 1.5s ease-out forwards;
                  }
                `}
              </style>

              <div className="flex justify-between items-end gap-4">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <span className="font-mono text-[10px] font-bold bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 px-1.5 py-0.5 rounded mt-0.5 shrink-0">
                    {cleanKey}
                  </span>
                  <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 leading-snug">
                    {questionText}
                  </span>
                </div>
                <span className={`text-sm font-black shrink-0 ${color.text}`}>
                  {item.avg.toFixed(2)} / 5.00
                </span>
              </div>

              <div className="w-full bg-zinc-100 dark:bg-zinc-700 rounded-full h-2.5 overflow-hidden">
                <div
                  id={barId}
                  className={`h-full ${color.bar} rounded-full w-full origin-left`}
                />
              </div>
            </div>
          );
        })}
    </div>
  );
}
