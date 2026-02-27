import { Octokit } from '@octokit/rest';
import matter from 'gray-matter';
import type { Note, NoteFrontmatter, NoteCategory } from '@/types/note';

const OWNER = process.env.GITHUB_OWNER!;
const REPO = process.env.GITHUB_REPO!;
const BRANCH = process.env.GITHUB_BRANCH ?? 'main';

function getOctokit() {
  return new Octokit({ auth: process.env.GITHUB_TOKEN });
}

function buildPath(category: NoteCategory, id: string) {
  return `notes/${category}/${id}.md`;
}

function serializeNote(frontmatter: NoteFrontmatter, content: string): string {
  return matter.stringify(content, frontmatter as unknown as Record<string, unknown>);
}

// ノート一覧を取得
export async function listNotes(category?: NoteCategory): Promise<Note[]> {
  const octokit = getOctokit();
  const categories: NoteCategory[] = category ? [category] : ['learning', 'specs'];
  const notes: Note[] = [];

  for (const cat of categories) {
    try {
      const { data } = await octokit.repos.getContent({
        owner: OWNER,
        repo: REPO,
        path: `notes/${cat}`,
        ref: BRANCH,
      });
      if (!Array.isArray(data)) continue;

      for (const file of data) {
        if (!file.name.endsWith('.md')) continue;
        const note = await getNote(cat, file.name.replace('.md', ''));
        if (note) notes.push(note);
      }
    } catch {
      // ディレクトリが存在しない場合はスキップ
    }
  }

  return notes.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

// ノートを1件取得
export async function getNote(category: NoteCategory, id: string): Promise<Note | null> {
  const octokit = getOctokit();
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
  content: string
): Promise<Note> {
  const octokit = getOctokit();
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
  sha: string
): Promise<Note> {
  const octokit = getOctokit();
  const fileContent = serializeNote(frontmatter, content);

  await octokit.repos.createOrUpdateFileContents({
    owner: OWNER,
    repo: REPO,
    path: buildPath(category, id),
    message: `update: "${frontmatter.title}" (${frontmatter.status})`,
    content: Buffer.from(fileContent).toString('base64'),
    sha,
    branch: BRANCH,
  });

  return { ...frontmatter, id, slug: `${category}/${id}`, content, sha };
}

// ノートを削除
export async function deleteNote(
  category: NoteCategory,
  id: string,
  sha: string
): Promise<void> {
  const octokit = getOctokit();
  await octokit.repos.deleteFile({
    owner: OWNER,
    repo: REPO,
    path: buildPath(category, id),
    message: `delete: note ${id}`,
    sha,
    branch: BRANCH,
  });
}
