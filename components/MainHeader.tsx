import Link from "next/link";

export default function MainHeader() {
  return (
    <header className="hidden md:flex h-12 border-b border-border items-center px-4 justify-between bg-background shrink-0">
      <Link
        href="/home"
        className="flex items-center gap-2 text-sm font-bold text-foreground hover:opacity-80 transition-opacity"
      >
        <span className="size-6 rounded bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
          TR
        </span>
        Thought Refinery
      </Link>
      <nav className="flex items-center gap-1">
        <Link
          href="/home"
          className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-muted"
        >
          ホーム
        </Link>
        <Link
          href="/list/learning"
          className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-muted"
        >
          リスト
        </Link>
        <Link
          href="/settings"
          className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-muted"
        >
          設定
        </Link>
      </nav>
    </header>
  );
}
