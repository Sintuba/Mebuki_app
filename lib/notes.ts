/**
 * ノート操作のバックエンド切り替えアダプター
 *
 * NOTES_BACKEND=github → lib/github.ts （GitHub API）
 * NOTES_BACKEND=local  → lib/local.ts  （ローカルファイル） ← 現在の設定
 *
 * GitHub バックアップ同期に戻すには .env.local で NOTES_BACKEND=github に変更するだけ
 */

export {
  listNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  cachedListNotes,
} from './github'
