import { Octokit } from '@octokit/rest';
import matter from 'gray-matter';
import { unstable_cache } from 'next/cache';
import type { Note, NoteFrontmatter, NoteCategory } from '@/types/note';

const OWNER = process.env.GITHUB_OWNER!;
const REPO = process.env.GITHUB_REPO!;
const BRANCH = process.env.GITHUB_BRANCH ?? 'main';

function getOctokit(token?: string) {
  return new Octokit({ auth: token ?? process.env.GITHUB_TOKEN });
}

function buildPath(category: NoteCategory, id: string) {
  return `notes/${category}/${id}.md`;
}

function serializeNote(frontmatter: NoteFrontmatter, content: string): string {
  return matter.stringify(content, frontmatter as unknown as Record<string, unknown>);
}

// ノート一覧を取得
export async function listNotes(category?: NoteCategory, token?: string): Promise<Note[]> {
  const octokit = getOctokit(token);
  const categories: NoteCategory[] = category ? [category] : ['learning', 'specs', 'snippets', 'logs', 'rules'];

  // カテゴリを並列フェッチ
  const perCategory = await Promise.all(
    categories.map(async (cat) => {
      try {
        const { data } = await octokit.repos.getContent({
          owner: OWNER,
          repo: REPO,
          path: `notes/${cat}`,
          ref: BRANCH,
        });
        if (!Array.isArray(data)) return [];

        // カテゴリ内のノートも並列フェッチ
        const notes = await Promise.all(
          data
            .filter((f) => f.name.endsWith('.md'))
            .map((f) => getNote(cat, f.name.replace('.md', ''), token))
        );
        return notes.filter((n): n is Note => n !== null);
      } catch {
        return [];
      }
    })
  );

  return perCategory
    .flat()
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

// ノートを1件取得
export async function getNote(category: NoteCategory, id: string, token?: string): Promise<Note | null> {
  const octokit = getOctokit(token);
  try {
    const { data } = await octokit.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path: buildPath(category, id),
      ref: BRANCH,
    });
    if (Array.isArray(data) || data.type !== 'file') return null;

    const raw = Buffer.from(data.content, 'base64').toString('utf-8');
    const { data: fm, content } = matter(raw);
    return {
      ...(fm as NoteFrontmatter),
      ai_reviewed: (fm.ai_reviewed as boolean) ?? false, // 既存ノートのデフォルト
      id,
      slug: `${category}/${id}`,
      content: content.trim(),
      sha: data.sha,
    };
  } catch {
    return null;
  }
}

// ノートを作成
export async function createNote(
  category: NoteCategory,
  id: string,
  frontmatter: NoteFrontmatter,
  content: string,
  token?: string
): Promise<Note> {
  const octokit = getOctokit(token);
  const fileContent = serializeNote(frontmatter, content);

  await octokit.repos.createOrUpdateFileContents({
    owner: OWNER,
    repo: REPO,
    path: buildPath(category, id),
    message: `feat: add note "${frontmatter.title}"`,
    content: Buffer.from(fileContent).toString('base64'),
    branch: BRANCH,
  });

  return { ...frontmatter, id, slug: `${category}/${id}`, content };
}

// ノートを更新
export async function updateNote(
  category: NoteCategory,
  id: string,
  frontmatter: NoteFrontmatter,
  content: string,
  sha: string,
  token?: string
): Promise<Note> {
  const octokit = getOctokit(token);
  const fileContent = serializeNote(frontmatter, content);

  const { data } = await octokit.repos.createOrUpdateFileContents({
    owner: OWNER,
    repo: REPO,
    path: buildPath(category, id),
    message: `update: "${frontmatter.title}" (${frontmatter.status})`,
    content: Buffer.from(fileContent).toString('base64'),
    sha,
    branch: BRANCH,
  });

  const newSha = data.content?.sha ?? sha;
  return { ...frontmatter, id, slug: `${category}/${id}`, content, sha: newSha };
}

// キャッシュ付きノート一覧取得（サーバーコンポーネント用）
// - revalidate: 60秒（保存・削除時は revalidateTag('notes') で即時無効化）
export function cachedListNotes(token: string, category?: NoteCategory) {
  return unstable_cache(
    () => listNotes(category, token),
    [token, category ?? 'all'],
    { tags: ['notes'], revalidate: 60 }
  )()
}

// ノートを削除
export async function deleteNote(
  category: NoteCategory,
  id: string,
  sha: string,
  token?: string
): Promise<void> {
  const octokit = getOctokit(token);
  await octokit.repos.deleteFile({
    owner: OWNER,
    repo: REPO,
    path: buildPath(category, id),
    message: `delete: note ${id}`,
    sha,
    branch: BRANCH,
  });
}
