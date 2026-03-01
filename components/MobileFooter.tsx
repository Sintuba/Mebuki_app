"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AiReviewTab } from "@/components/ai-review-tab";

const CATEGORIES = [
  { value: "learning", label: "学習メモ" },
  { value: "specs", label: "仕様書" },
  { value: "snippets", label: "コード断片" },
  { value: "logs", label: "作業ログ" },
  { value: "rules", label: "ルール集" },
] as const;

export default function MobileFooter() {
  const pathname = usePathname();
  const router = useRouter();
  const [listOpen, setListOpen] = useState(false);

  const handleCategoryClick = (href: string) => {
    setListOpen(false);
    router.push(href);
  };

  return (
    <>
      {/* カテゴリドロワー */}
      {listOpen && (
        <>
          <div
            className="fixed inset-0 z-20 bg-black/20"
            onClick={() => setListOpen(false)}
          />
          <div className="fixed bottom-13 left-0 right-0 z-20 md:hidden bg-background border-t border-border shadow-md animate-in slide-in-from-bottom-2 duration-150">
            <nav className="flex flex-col py-1">
              {CATEGORIES.map((cat) => {
                const href = `/list/${cat.value}`;
                const isActive = pathname === href;
                return (
                  <button
                    key={cat.value}
                    onClick={() => handleCategoryClick(href)}
                    className={`w-full text-left px-5 py-3 text-sm transition-colors ${
                      isActive
                        ? "bg-muted text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
              <div className="my-1 border-t border-border mx-4" />
              <button
                onClick={() => handleCategoryClick("/list/archive")}
                className={`w-full text-left px-5 py-3 text-sm transition-colors ${
                  pathname === "/list/archive"
                    ? "bg-muted text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                アーカイブ
              </button>
              <button
                onClick={() => handleCategoryClick("/list/trash")}
                className={`w-full text-left px-5 py-3 text-sm transition-colors ${
                  pathname === "/list/trash"
                    ? "bg-muted text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                宿根
              </button>
              <div className="my-1 border-t border-border mx-4" />
              <button
                onClick={() => handleCategoryClick("/list/import")}
                className={`w-full text-left px-5 py-3 text-sm transition-colors ${
                  pathname === "/list/import"
                    ? "bg-muted text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                インポート
              </button>
            </nav>
          </div>
        </>
      )}

      <footer className="flex md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-background z-30 overflow-visible flex-col">
        <div className="flex h-14">
        {/* ホーム */}
        <Link
          href="/home"
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
            pathname === "/home" ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span className="text-[10px]">ホーム</span>
        </Link>

        {/* AI レビュー（中央） */}
        <AiReviewTab />

        {/* リスト（タップでカテゴリドロワー） */}
        <button
          onClick={() => setListOpen((v) => !v)}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
            pathname.startsWith("/list") || listOpen ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          <span className="text-[10px]">リスト</span>
        </button>
        </div>
        {/* iOS ホームインジケーター safe area */}
        <div style={{ height: 'env(safe-area-inset-bottom)' }} />
      </footer>
    </>
  );
}
