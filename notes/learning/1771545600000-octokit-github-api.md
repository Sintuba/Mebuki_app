---
title: Octokit で GitHub API 操作
status: refining
category: learning
ai_outcome: none
ai_reviewed: true
createdAt: '2026-02-20T00:00:00.000Z'
updatedAt: '2026-03-01T02:45:42.759Z'
---
## Octokit とは

GitHub 公式の JavaScript クライアントライブラリ。REST API と GraphQL API の両方をサポート。

## 基本的な使い方

```ts
import { Octokit } from '@octokit/rest'

const octokit = new Octokit({ auth: 'YOUR_TOKEN' })

// リポジトリのファイル取得
const { data } = await octokit.repos.getContent({
  owner: 'username',
  repo: 'repo-name',
  path: 'path/to/file.md',
})
```

## ファイルの作成・更新

Base64 エンコードが必要。sha が必要（更新時）。

あとで整理する
