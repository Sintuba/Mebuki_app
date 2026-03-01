export type NoteStatus = 'raw' | 'refining' | 'stable' | 'trashed';
export type NoteCategory = 'learning' | 'specs' | 'snippets' | 'logs' | 'rules';
export type AiOutcome = 'none' | 'promote' | 'keep';

export interface AiEditRecord {
  at: string;       // ISO timestamp
  summary: string;  // AIによる変更概要
}

export interface NoteFrontmatter {
  title: string;
  status: NoteStatus;
  category: NoteCategory;
  ai_outcome: AiOutcome;
  ai_reviewed: boolean;  // AI評価を一度でも受けたか（昇華ゲート）
  ai_edits?: AiEditRecord[];  // AIマージ変更履歴
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
