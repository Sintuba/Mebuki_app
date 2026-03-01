"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Settings, X } from "lucide-react";
import Logo from "@/components/ui/Logo";

export default function MobileHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const isSettings = pathname === "/settings";

  return (
    <header className="flex md:hidden h-12 border-b border-border items-center px-4 justify-between bg-background shrink-0 sticky top-0 z-30">
      <Link href="/home" className="hover:opacity-80 transition-opacity">
        <Logo size={26} variant="wordmark" />
      </Link>

      <button
        onClick={() => isSettings ? router.back() : router.push("/settings")}
        className={`flex items-center justify-center w-9 h-9 rounded-md transition-colors ${
          isSettings
            ? "text-foreground bg-muted"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
        aria-label={isSettings ? "閉じる" : "設定"}
      >
        {isSettings ? <X className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
      </button>
    </header>
  );
}
