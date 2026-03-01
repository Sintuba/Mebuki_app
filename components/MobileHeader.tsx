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
    <header className="flex md:hidden flex-col border-b border-border bg-background shrink-0 sticky top-0 z-30">
      {/* iOS ステータスバー safe area */}
      <div style={{ height: 'env(safe-area-inset-top)' }} />
      <div className="flex h-14 items-center px-4 justify-between">
        <Link href="/home" className="hover:opacity-80 transition-opacity py-2 pr-6">
          <Logo size={28} variant="wordmark" />
        </Link>

        <button
          onClick={() => isSettings ? router.back() : router.push("/settings")}
          className={`flex items-center justify-center w-11 h-11 rounded-md transition-colors ${
            isSettings
              ? "text-foreground bg-muted"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
          aria-label={isSettings ? "閉じる" : "設定"}
        >
          {isSettings ? <X className="w-6 h-6" /> : <Settings className="w-6 h-6" />}
        </button>
      </div>
    </header>
  );
}
