---
title: Octokit REST API の使い方
status: raw
category: snippets
ai_review: false
createdAt: "2026-02-28T06:00:00.000Z"
updatedAt: "2026-02-28T06:00:00.000Z"
---

## ファイル取得

```typescript
const { data } = await octokit.repos.getContent({
  owner: 'username',
  repo: 'repo-name',
  path: 'path/to/file.md',
  ref: 'main',
})
// data.content は base64 エンコード
const content = Buffer.from(data.content, 'base64').toString('utf-8')
```

## ファイル作成・更新

```typescript
await octokit.repos.createOrUpdateFileContents({
  owner, repo, path,
  message: 'commit message',
  content: Buffer.from(fileContent).toString('base64'),
  sha,      // 更新時のみ必要（作成時は不要）
  branch: 'main',
})
```

## ディレクトリ一覧

```typescript
const { data } = await octokit.repos.getContent({
  owner, repo,
  path: 'notes/learning',  // ディレクトリパス
})
// data が配列になる
```
