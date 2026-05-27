"use client";

import { useId } from "react";

interface StatItem {
  avg: number;
  label: string;
}

interface StatsProps {
  stats: Record<string, StatItem>;
  totalVotes: number;
}

export function StatsChart({ stats, totalVotes }: StatsProps) {
  const baseId = useId().replace(/:/g, "");

  return (
    <div key={JSON.stringify(stats)} className="space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
        <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest">
          Szczegółowa ocena
        </h3>
        <div className="flex items-center gap-2 bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-100">
          <span className="text-[10px] font-bold text-zinc-400 uppercase">
            Głosów:
          </span>
          <span className="text-xs font-black text-indigo-600">
            {totalVotes}
          </span>
        </div>
      </div>

      {Object.entries(stats)
        .sort(([keyA], [keyB]) => {
          const cleanA = keyA.replace("avg", "");
          const cleanB = keyB.replace("avg", "");
          return cleanA.localeCompare(cleanB, undefined, { numeric: true, sensitivity: 'base' });
        })
        .map(([key, item]) => {
          const cleanKey = key.replace("avg", "");
          const scale = Math.min(item.avg / 5, 1);
          const barId = `bar_${baseId}_${key}`;

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

              <div className="flex justify-between items-end">
                <span className="text-sm font-bold text-zinc-700">
                  <span className="text-zinc-400 mr-2">Średnia pytania:</span>
                  {item.label}
                </span>
                <span className="text-sm font-black text-indigo-600">
                  {item.avg.toFixed(2)} / 5.00
                </span>
              </div>

              <div className="w-full bg-zinc-100 rounded-full h-2.5 overflow-hidden">
                <div
                  id={barId}
                  className="h-full bg-indigo-600 rounded-full w-full origin-left"
                />
              </div>
            </div>
          );
        })}
    </div>
  );
}