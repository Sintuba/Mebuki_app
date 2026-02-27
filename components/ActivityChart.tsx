"use client";
import { useState } from "react";

type Period = { label: string; added: number; refined: number };

interface ActivityData {
  daily: Period[];
  weekly: Period[];
  monthly: Period[];
}

const VIEWS = [
  { key: "daily", label: "1日" },
  { key: "weekly", label: "週間" },
  { key: "monthly", label: "月間" },
] as const;

type ViewKey = "daily" | "weekly" | "monthly";

export default function ActivityChart({ data }: { data: ActivityData }) {
  const [view, setView] = useState<ViewKey>("weekly");
  const periods = data[view];
  const maxVal = Math.max(...periods.flatMap((p) => [p.added, p.refined]), 1);
  const chartH = 100;
  const chartW = 300;

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        週間アクティビティ
      </h2>
      <div className="border border-border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <span className="inline-block size-2 rounded-sm bg-blue-500" />
              <span className="text-[10px] text-muted-foreground">追加メモ</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block size-2 rounded-sm bg-green-500" />
              <span className="text-[10px] text-muted-foreground">昇華数</span>
            </div>
          </div>
          <div className="flex gap-1">
            {VIEWS.map((v) => (
              <button
                key={v.key}
                onClick={() => setView(v.key)}
                className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
                  view === v.key
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <svg
          viewBox={`0 0 ${chartW} ${chartH + 18}`}
          className="w-full"
          style={{ overflow: "visible" }}
        >
          {/* Grid lines */}
          {[0, 0.33, 0.67, 1].map((t) => (
            <line
              key={t}
              x1={0}
              y1={chartH * (1 - t)}
              x2={chartW}
              y2={chartH * (1 - t)}
              stroke="#e5e5e5"
              strokeWidth="0.5"
            />
          ))}

          {/* Bars */}
          {periods.map((p, i) => {
            const slotW = chartW / periods.length;
            const cx = slotW * i + slotW / 2;
            const bw = Math.max(slotW / 5.5, 3);
            const addedH = (p.added / maxVal) * chartH;
            const refinedH = (p.refined / maxVal) * chartH;

            return (
              <g key={i}>
                <rect
                  x={cx - bw - 1}
                  y={chartH - addedH}
                  width={bw}
                  height={Math.max(addedH, 1)}
                  fill="#3b82f6"
                  rx="1"
                />
                <rect
                  x={cx + 1}
                  y={chartH - refinedH}
                  width={bw}
                  height={Math.max(refinedH, 1)}
                  fill="#22c55e"
                  rx="1"
                />
                <text
                  x={cx}
                  y={chartH + 13}
                  textAnchor="middle"
                  fontSize="7"
                  fill="#a3a3a3"
                >
                  {p.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
