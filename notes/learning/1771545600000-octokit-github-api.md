---
title: Octokit で GitHub API 操作
status: refining
category: learning
ai_outcome: none
ai_reviewed: true
createdAt: '2026-02-20T00:00:00.000Z'
updatedAt: '2026-03-01T02:56:57.211Z'
---
## Octokit で GitHub API 操作

GitHub API を JavaScript から操作するための公式クライアントライブラリ Octokit について解説します。

### Octokit とは

Octokit は、GitHub が公式に提供する JavaScript クライアントライブラリです。GitHub の REST API と GraphQL API の両方をサポートしており、Node.js 環境とブラウザ環境のどちらでも利用できます。API リクエストの認証、レートリミット処理、エラーハンドリングなどを抽象化し、GitHub API をより簡単に扱えるように設計されています。

### 基本的な使い方

Octokit を使用するには、まずインスタンスを作成し、認証情報を設定します。認証には、通常、GitHub のパーソナルアクセストークン（PAT）を使用します。セキュリティのため、トークンは環境変数などで安全に管理することが推奨されます。

```ts
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: 'YOUR_GITHUB_TOKEN' // 環境変数から取得するなどの方法でセット
});

/**
 * リポジトリ内の特定のファイルの内容を取得する例
 * @param owner リポジトリの所有者（ユーザー名または組織名）
 * @param repo リポジトリ名
 * @param path 取得したいファイルのパス
 * @returns ファイルの内容（デコード済み）またはnull
 */
async function getRepositoryFileContent(owner: string, repo: string, path: string): Promise<string | null> {
  try {
    const { data } = await octokit.repos.getContent({
      owner: owner,
      repo: repo,
      path: path,
      ref: 'main', // オプション: 取得するブランチ名（デフォルトはリポジトリのデフォルトブランチ）
    });

    // getContent API は、ファイルの内容をBase64エンコードして返すことがあります。
    if (typeof data === 'object' && data !== null && 'content' in data && typeof data.content === 'string' && data.encoding === 'base64') {
      const decodedContent = Buffer.from(data.content, 'base64').toString('utf8');
      console.log(`ファイルの内容:\n${decodedContent}`);
      return decodedContent;
    } else if (typeof data === 'object' && data !== null && 'content' in data && typeof data.content === 'string') {
      // Base64エンコードされていない場合
      console.log(`ファイルの内容:\n${data.content}`);
      return data.content;
    } else {
      // ファイルではなくディレクトリやシンボリックリンクの場合など
      console.warn('ファイルの内容を取得できませんでした。指定されたパスがファイルではない可能性があります。');
      return null;
    }
  } catch (error) {
    console.error('ファイル取得中にエラーが発生しました:', error);
    throw error;
  }
}

// 使用例:
// getRepositoryFileContent('your-username', 'your-repo', 'README.md');
```

### ファイルの作成・更新

GitHub API でリポジトリ内のファイルをプログラム的に作成または更新するには、`octokit.repos.createOrUpdateFileContents` メソッドを使用します。この操作にはいくつかの重要な要件があります。

*   **内容のエンコード**: アップロードするファイルの内容は、Base64 エンコードする必要があります。
*   **SHA の指定**: 既存ファイルを更新する場合、そのファイルの現在の SHA (Secure Hash Algorithm) を指定する必要があります。これは、同時編集による競合を防ぐためのものです。ファイルの SHA は `getContent` などで事前に取得できます。
*   **コミットメッセージ**: ファイル操作には必ずコミットメッセージが必要です。

これらの具体的な実装については、別途コード例とともに整理を進めます。
