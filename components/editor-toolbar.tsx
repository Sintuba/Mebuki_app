"use client";

import type { NoteStatus } from "@/types/note";

const STATUS_LABELS: Record<NoteStatus, string> = {
  raw: "未整理",
  refining: "整理中",
  stable: "完成",
};

const STATUS_ORDER: NoteStatus[] = ["raw", "refining", "stable"];

interface ToggleButtonProps {
  active: boolean;
  onToggle: () => void;
  label: string;
}

function ToggleButton({ active, onToggle, label }: ToggleButtonProps) {
  return (
    <button
      onClick={onToggle}
      className={`text-[10px] px-2 py-1 rounded transition-colors ${
        active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:text-foreground border border-border"
      }`}
    >
      {label}
    </button>
  );
}

interface EditorToolbarProps {
  aiReview: boolean;
  onAiReviewChange: (v: boolean) => void;
  promoteCandidate: boolean;
  onPromoteCandidateChange: (v: boolean) => void;
  keep: boolean;
  onKeepChange: (v: boolean) => void;
  hasChanges: boolean;
  hasContent: boolean;
  status: NoteStatus;
  saving?: boolean;
  onSave: () => void;
  onPromote: () => void;
  onDemote: () => void;
  onYamlCopy: () => void;
}

export function EditorToolbar({
  aiReview,
  onAiReviewChange,
  promoteCandidate,
  onPromoteCandidateChange,
  keep,
  onKeepChange,
  hasChanges,
  hasContent,
  status,
  saving = false,
  onSave,
  onPromote,
  onDemote,
  onYamlCopy,
}: EditorToolbarProps) {
  const currentIdx = STATUS_ORDER.indexOf(status);
  const canPromote = currentIdx < STATUS_ORDER.length - 1;
  const canDemote = currentIdx > 0;

  return (
    <div className="shrink-0 border-t border-border px-4 py-2 flex items-center gap-2 bg-background">
      {/* トグル */}
      <div className="flex items-center gap-1.5">
        <ToggleButton
          active={aiReview}
          onToggle={() => onAiReviewChange(!aiReview)}
          label="AI"
        />
        <ToggleButton
          active={promoteCandidate}
          onToggle={() => onPromoteCandidateChange(!promoteCandidate)}
          label="候補"
        />
        <ToggleButton
          active={keep}
          onToggle={() => onKeepChange(!keep)}
          label="保持"
        />
      </div>

      <div className="flex-1" />

      {/* アクション */}
      <button
        onClick={onYamlCopy}
        className="text-[10px] text-muted-foreground hover:text-foreground px-2 py-1 rounded transition-colors"
        title="YAMLをコピー"
      >
        YAML
      </button>

      {canDemote && (
        <button
          onClick={onDemote}
          className="text-[10px] text-muted-foreground hover:text-foreground px-2 py-1 rounded border border-border transition-colors"
        >
          ↓ {STATUS_LABELS[STATUS_ORDER[currentIdx - 1]]}
        </button>
      )}

      <button
        onClick={onSave}
        disabled={saving || !hasChanges}
        className="text-[10px] px-3 py-1 rounded border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {saving ? "保存中..." : hasChanges ? "保存" : "保存済み"}
      </button>

      {canPromote && hasContent && (
        <button
          onClick={onPromote}
          className="text-[10px] px-3 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          昇華 →
        </button>
      )}
    </div>
  );
}
