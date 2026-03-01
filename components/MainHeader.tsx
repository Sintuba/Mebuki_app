import Link from "next/link";
import Logo from "@/components/ui/Logo";

export default function MainHeader() {
  return (
    <header className="hidden md:flex h-12 border-b border-border items-center px-4 justify-between bg-background shrink-0 sticky top-0 z-30">
      <Link href="/home" className="hover:opacity-80 transition-opacity">
        <Logo size={28} variant="wordmark" />
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
