import Link from "next/link";

export default function MobileHeader() {
  return (
    <header className="flex md:hidden h-12 border-b border-border items-center px-4 justify-between bg-background shrink-0">
      <Link
        href="/home"
        className="flex items-center gap-2 text-sm font-bold text-foreground"
      >
        <span className="size-6 rounded bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
          TR
        </span>
        Thought Refinery
      </Link>
    </header>
  );
}
