export type NoteStatus = 'raw' | 'refining' | 'stable';
export type NoteCategory = 'learning' | 'specs' | 'snippets' | 'logs' | 'rules';

export interface NoteFrontmatter {
  title: string;
  status: NoteStatus;
  category: NoteCategory;
  ai_review: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Note extends NoteFrontmatter {
  id: string;       // ファイル名（拡張子なし）
  slug: string;     // category/id
  content: string;  // Markdownの本文
  sha?: string;     // GitHub API用
}

export interface NoteListItem extends NoteFrontmatter {
  id: string;
  slug: string;
  excerpt: string;
}
