export const CATEGORY_LABELS = {
  learning: '学習メモ',
  specs: '仕様書',
  snippets: 'コード断片',
  logs: '作業ログ',
  rules: 'ルール集',
} as const

export const CATEGORY_HINTS = {
  learning: '学習・技術メモを整理',
  specs: '仕様書・設計書を管理',
  snippets: 'コードスニペットを保存',
  logs: '作業ログ・日記を記録',
  rules: 'ルール・規約を定義',
} as const

export const STATUS_LABELS = {
  raw: '未整理',
  refining: '整理中',
  stable: '完成',
  trashed: '宿根',
} as const
