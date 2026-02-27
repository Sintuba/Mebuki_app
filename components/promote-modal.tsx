"use client";

interface PromoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  content: string;
}

export function PromoteModal({
  open,
  onOpenChange,
  onConfirm,
  content,
}: PromoteModalProps) {
  if (!open) return null;

  const charCount = content.trim().length;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* 背景オーバーレイ */}
      <div
        className="absolute inset-0 bg-foreground/10"
        onClick={() => onOpenChange(false)}
      />

      {/* モーダル本体 */}
      <div
        className="relative z-10 w-full max-w-md bg-background border border-border rounded-t-xl md:rounded-xl p-5 space-y-4 mx-0 md:mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h3 className="text-sm font-medium text-foreground">昇華の確認</h3>
          <p className="text-xs text-muted-foreground mt-1">
            このノートを次のステータスに昇華します。
          </p>
        </div>

        {/* コンテンツプレビュー */}
        <div className="border border-border rounded-lg p-3 bg-muted/30">
          <div className="text-[10px] text-muted-foreground mb-1.5">
            コンテンツプレビュー
          </div>
          <p className="text-xs text-foreground font-mono leading-relaxed line-clamp-4">
            {content.slice(0, 150)}
            {content.length > 150 ? "…" : ""}
          </p>
          <div className="text-[10px] text-muted-foreground mt-2">
            {charCount} 文字
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={() => onOpenChange(false)}
            className="text-xs px-4 py-2 rounded border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            className="text-xs px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            昇華する
          </button>
        </div>
      </div>
    </div>
  );
}
