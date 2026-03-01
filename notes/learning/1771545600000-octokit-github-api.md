---
title: Octokit で GitHub API 操作
status: trashed
category: learning
ai_outcome: none
ai_reviewed: true
createdAt: '2026-02-20T00:00:00.000Z'
updatedAt: '2026-03-01T06:52:47.943Z'
---
# Octokit で GitHub API 操作

GitHub API を JavaScript から手軽に、かつ安全に操作するための公式クライアントライブラリ「Octokit」について、その概要から具体的な使用方法、さらに実践的な考慮事項までを詳しく解説します。

## Octokit とは

Octokit は、GitHub が公式に提供するJavaScript クライアントライブラリです。GitHub の膨大な REST API と GraphQL API の両方をサポートしており、Node.js 環境とブラウザ環境のどちらでもシームレスに利用できます。API リクエストの認証、複雑なレートリミット処理、詳細なエラーハンドリング、ページネーションなどを抽象化し、開発者がGitHub API をより簡単に、そして効率的に扱えるように設計されています。

## 基本的な使い方

Octokit を使用するには、まずインスタンスを作成し、GitHub API へのアクセスに必要な認証情報を設定します。認証には、通常、GitHub のパーソナルアクセストークン（PAT）を使用します。セキュリティのため、トークンは環境変数などで安全に管理することが強く推奨されます。

### 1. インストール

```bash
npm install @octokit/rest
# または yarn add @octokit/rest
```

### 2. インスタンスの作成と認証

環境変数からトークンを読み込む例。

```ts
import { Octokit } from '@octokit/rest';

// 環境変数からGitHubトークンを取得
// Node.js環境ではprocess.env.GITHUB_TOKEN、ブラウザでは異なる方法で安全に扱う
const githubToken = process.env.GITHUB_TOKEN; 

if (!githubToken) {
  throw new Error('GitHub Personal Access Token is not set.');
}

const octokit = new Octokit({
  auth: githubToken 
});

console.log('Octokitインスタンスが初期化されました。');
```

### 3. API操作の例

Octokitは、APIパスに対応するメソッドを提供しており、直感的に操作できます。ここではいくつかの典型的な操作例を紹介します。

#### a. ユーザー情報を取得する

現在の認証ユーザーの情報を取得します。

```ts
async function getUserInfo() {
  try {
    const { data: user } = await octokit.rest.users.getAuthenticated();
    console.log(`Authenticated user: ${user.login} (ID: ${user.id})`);
    console.log(`Profile URL: ${user.html_url}`);
  } catch (error) {
    console.error('Error fetching user info:', error);
  }
}

// getUserInfo();
```

#### b. 特定のリポジトリ情報を取得する

オーナー名とリポジトリ名を指定して、リポジトリの詳細情報を取得します。

```ts
async function getRepoInfo(owner: string, repo: string) {
  try {
    const { data: repository } = await octokit.rest.repos.get({
      owner,
      repo,
    });
    console.log(`Repository: ${repository.full_name}`);
    console.log(`Stars: ${repository.stargazers_count}`);
    console.log(`Description: ${repository.description || 'N/A'}`);
  } catch (error) {
    console.error(`Error fetching repository ${owner}/${repo} info:`, error);
  }
}

// getRepoInfo('octokit', 'octokit.js');
```

#### c. 新しいイシューを作成する

指定されたリポジトリに新しいイシューを作成します。

```ts
async function createIssue(owner: string, repo: string, title: string, body: string) {
  try {
    const { data: issue } = await octokit.rest.issues.create({
      owner,
      repo,
      title,
      body,
    });
    console.log(`Issue created: #${issue.number} - ${issue.title}`);
    console.log(`Issue URL: ${issue.html_url}`);
  } catch (error) {
    console.error('Error creating issue:', error);
  }
}

// createIssue('your-username', 'your-repo', 'Bug Report: Login Error', 'ユーザーがログインできません。');
```

## 高度な使い方と考慮事項

### レートリミット処理

GitHub API にはレートリミットが設定されており、短時間に大量のリクエストを送信すると制限がかかります。Octokitはデフォルトでレートリミットヘッダーを解釈し、必要に応じてリクエストを自動的にリトライする機能（`@octokit/plugin-throttling`など）を提供します。大規模な処理を行う際は、これらのプラグインの利用を検討してください。

### エラーハンドリング

APIリクエストが失敗した場合、Octokitは `HttpError` インスタンスをスローします。これにはステータスコードやエラーメッセージなどの情報が含まれるため、適切な `try...catch` ブロックで処理することが重要です。

```ts
try {
  // ... API call ...
} catch (error) {
  if (error.status) { // GitHub APIからのエラーレスポンス
    console.error(`GitHub API Error: Status ${error.status}, Message: ${error.message}`);
  } else {
    console.error('An unexpected error occurred:', error);
  }
}
```

### GraphQL API の利用

OctokitはREST APIだけでなく、GraphQL APIもサポートしています。`octokit.graphql` メソッドを使用することで、クエリを直接記述して利用できます。

```ts
async function getRepoNameAndIssues(owner: string, repo: string) {
  const query = `
    query($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        name
        issues(last: 5) {
          nodes {
            title
            url
          }
        }
      }
    }
  `;
  try {
    const result = await octokit.graphql(query, { owner, repo });
    console.log('GraphQL Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error fetching data via GraphQL:', error);
  }
}

// getRepoNameAndIssues('octokit', 'octokit.js');
```

## まとめ

Octokitは、GitHub API を JavaScript から安全かつ効率的に操作するための強力なライブラリです。基本的な認証から複雑なAPI操作、そしてエラーハンドリングやレートリミットへの対応まで、GitHubとの連携を必要とするあらゆるプロジェクトにおいて、開発体験を大幅に向上させます。公式ドキュメントや関連プラグインを活用し、さらに高度な利用を目指しましょう。

### 参考資料

*   [Octokit.js 公式ドキュメント](https://octokit.github.io/rest.js/)
*   [GitHub REST API ドキュメント](https://docs.github.com/rest)
*   [GitHub GraphQL API ドキュメント](https://docs.github.com/graphql)
