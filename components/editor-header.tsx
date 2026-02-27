"use client";

import Link from "next/link";
import type { NoteStatus } from "@/types/note";

const CATEGORY_LABELS: Record<string, string> = {
  learning: "学習メモ",
  specs: "仕様書",
  snippets: "コード断片",
  logs: "作業ログ",
  rules: "ルール集",
};

const STATUS_STYLES: Record<NoteStatus, string> = {
  raw: "text-status-raw bg-muted",
  refining: "text-status-refining bg-orange-50",
  stable: "text-status-stable bg-green-50",
};

const STATUS_LABELS: Record<NoteStatus, string> = {
  raw: "未整理",
  refining: "整理中",
  stable: "完成",
};

interface EditorHeaderProps {
  title: string;
  onTitleChange: (title: string) => void;
  category: string;
  status: NoteStatus;
  aiReview: boolean;
  promoteCandidate: boolean;
  keep: boolean;
}

export function EditorHeader({
  title,
  onTitleChange,
  category,
  status,
  aiReview,
  promoteCandidate,
  keep,
}: EditorHeaderProps) {
  return (
    <div className="shrink-0 border-b border-border bg-background">
      {/* ナビゲーション行 */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/50">
        <Link
          href={`/list/${category}`}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          ← {CATEGORY_LABELS[category] ?? category}
        </Link>
        <span className="text-border text-xs">/</span>
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
            STATUS_STYLES[status] ?? "text-muted-foreground bg-muted"
          }`}
        >
          {STATUS_LABELS[status] ?? status}
        </span>

        <div className="flex-1" />

        {/* フラグバッジ */}
        {aiReview && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-badge-ai-bg text-badge-ai-fg font-medium">
            AI
          </span>
        )}
        {promoteCandidate && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-badge-promote-bg text-badge-promote-fg font-medium">
            候補
          </span>
        )}
        {keep && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
            保持
          </span>
        )}
      </div>

      {/* タイトル入力行 */}
      <div className="px-4 py-2.5">
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="タイトルを入力..."
          className="w-full text-sm font-medium bg-transparent text-foreground placeholder:text-muted-foreground/50 outline-none"
        />
      </div>
    </div>
  );
}
