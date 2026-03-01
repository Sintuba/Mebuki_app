import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: { params: { scope: "repo read:user" } },
    }),
  ],
  callbacks: {
    // 自分のGitHubアカウントのみサインインを許可
    signIn({ profile }) {
      const allowedUser = process.env.GITHUB_OWNER
      if (!allowedUser) return true // 未設定の場合はスキップ
      return (profile as { login?: string })?.login === allowedUser
    },
    authorized({ auth, request: { nextUrl } }) {
      const { pathname } = nextUrl;
      // PWA・静的アセットは認証不要（Chrome の PWA チェックが未認証で行われるため）
      if (
        pathname === '/manifest.webmanifest' ||
        pathname === '/manifest.json' ||
        pathname === '/sw.js' ||
        pathname.startsWith('/api/auth/') ||
        /\.(?:png|svg|ico|jpg|webp|css|woff2?)$/.test(pathname)
      ) {
        return true;
      }
      const isLoggedIn = !!auth?.user;
      const isOnLogin = pathname.startsWith("/login");
      if (isLoggedIn && isOnLogin) {
        return Response.redirect(new URL("/", nextUrl));
      }
      if (!isLoggedIn && !isOnLogin) {
        return Response.redirect(new URL("/login", nextUrl));
      }
      return true;
    },
    jwt({ token, account }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    session({ session, token }) {
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
});
