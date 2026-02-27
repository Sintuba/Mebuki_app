import { signIn } from "@/lib/auth";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-svh items-center justify-center bg-background overflow-hidden">
      {/* ドットグリッド背景 */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.59 0.2 255) 1px, transparent 1px), linear-gradient(90deg, oklch(0.59 0.2 255) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
        aria-hidden="true"
      />

      <section className="relative z-10 flex flex-col items-center gap-8 px-6">
        {/* ロゴ + タイトル */}
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-sm font-bold text-primary-foreground">TR</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Thought Refinery
          </h1>
          <p className="text-sm text-muted-foreground text-center max-w-xs leading-relaxed">
            殴り書きの思考を、構造化されたナレッジに昇華する
          </p>
        </div>

        {/* GitHub ログインボタン */}
        <form
          action={async () => {
            "use server";
            await signIn("github", { redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2.5 h-11 px-6 rounded-lg text-sm font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
            GitHub でログイン
          </button>
        </form>

        <p className="text-[11px] text-muted-foreground/50">
          OAuth 2.0 / repo scope
        </p>
      </section>
    </main>
  );
}
