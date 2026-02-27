"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const CATEGORIES = [
  { value: "learning", label: "学習メモ" },
  { value: "specs", label: "仕様書" },
  { value: "snippets", label: "コード断片" },
  { value: "logs", label: "作業ログ" },
  { value: "rules", label: "ルール集" },
] as const;

export default function CategorySidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-44 border-r border-border flex-col py-2 shrink-0 bg-background">
      {CATEGORIES.map((cat) => {
        const href = `/list/${cat.value}`;
        const isActive = pathname === href;
        return (
          <Link
            key={cat.value}
            href={href}
            className={`px-4 py-2 text-xs transition-colors ${
              isActive
                ? "bg-muted text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {cat.label}
          </Link>
        );
      })}
      <div className="my-1 border-t border-border mx-4" />
      <Link
        href="/list/import"
        className={`px-4 py-2 text-xs transition-colors ${
          pathname === "/list/import"
            ? "bg-muted text-foreground font-medium"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        }`}
      >
        インポート
      </Link>
    </aside>
  );
}
