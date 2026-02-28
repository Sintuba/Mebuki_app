---
title: Tailwind よく使うユーティリティ
status: refining
category: snippets
ai_outcome: none
ai_reviewed: false
createdAt: '2026-02-28T05:00:00.000Z'
updatedAt: '2026-02-28T10:06:27.056Z'
---
## レイアウト

```
flex flex-col min-h-svh          // 縦並び・全画面高さ
flex-1 min-h-0 overflow-y-auto   // 余白埋め・スクロール
grid grid-cols-2 md:grid-cols-4  // レスポンシブグリッド
```

## テキスト

```
text-xs text-muted-foreground    // 補助テキスト
text-sm font-medium text-foreground  // 本文
text-[10px]                      // 極小テキスト
truncate                         // 省略表示
```

## インタラクション

```
transition-colors hover:bg-muted  // ホバー
disabled:opacity-50 disabled:cursor-not-allowed  // 無効化
group hover:opacity-100 opacity-0  // グループホバー
```

## よく使う組み合わせ

```
// バッジ
inline-block px-1.5 py-0.5 rounded text-[10px] font-medium

// ボタン
text-[11px] px-2.5 py-1 rounded border border-border
```
