---
title: TypeScript ユーティリティ型まとめ
status: stable
category: learning
ai_outcome: none
ai_reviewed: true
createdAt: '2026-01-26T12:00:00.000Z'
updatedAt: '2026-03-01T02:52:43.956Z'
---
TypeScriptには、既存の型から新しい型を派生させるための便利な「ユーティリティ型」が多数用意されています。これらを活用することで、型の柔軟性を高め、コードの保守性や再利用性を向上させることができます。

ここでは、特によく使う主要なユーティリティ型を厳選してまとめました。

## 主要なユーティリティ型

### `Partial<T>`
全てのプロパティをオプショナル（任意）にするユーティリティ型です。既存の型を基に、部分的なオブジェクトを表現したい場合や、フォーム入力データのように一部のプロパパティしか持たないオブジェクトを扱う際に便利です。

```ts
interface Note {
  id: string;
  title: string;
  status: 'raw' | 'refining' | 'stable' | 'trashed';
  createdAt: Date;
  updatedAt: Date;
  sha: string;
}

type PartialNote = Partial<Note>;
// 結果の型:
// {
//   id?: string;
//   title?: string;
//   status?: 'raw' | 'refining' | 'stable' | 'trashed';
//   createdAt?: Date;
//   updatedAt?: Date;
//   sha?: string;
// }
```

### `Pick<T, K>`
型`T`から、指定したプロパティのキー`K`のみを抽出して新しい型を作成します。オブジェクトの一部だけを公開したい場合や、特定のプロパティセットを持つ簡潔な型を定義する際に役立ちます。

```ts
type NotePreview = Pick<Note, 'id' | 'title' | 'status'>;
// 結果の型:
// {
//   id: string;
//   title: string;
//   status: 'raw' | 'refining' | 'stable' | 'trashed';
// }
```

### `Omit<T, K>`
型`T`から、指定したプロパティのキー`K`を除外して新しい型を作成します。既存の型から一部のプロパティを除いた型が必要な場合、特にAPIレスポンスから内部的なプロパティを取り除きたい時などに便利です。

```ts
type NoteWithoutSha = Omit<Note, 'sha'>;
// 結果の型:
// {
//   id: string;
//   title: string;
//   status: 'raw' | 'refining' | 'stable' | 'trashed';
//   createdAt: Date;
//   updatedAt: Date;
// }
```

### `Record<K, V>`
キーの型`K`と値の型`V`を指定してオブジェクト型を定義します。辞書やマップのような構造を持つオブジェクト、特にenumや定数マッピングを表現する際によく使われます。

```ts
type NoteStatus = 'raw' | 'refining' | 'stable' | 'trashed';

const STATUS_LABELS: Record<NoteStatus, string> = {
  raw: '未整理',
  refining: '整理中',
  stable: '完成',
  trashed: '宿根',
};
// STATUS_LABELS の型は {
//   raw: string;
//   refining: string;
//   stable: string;
//   trashed: string;
// }
```

### `Exclude<T, U>`
型`T`から、型`U`に代入可能な（つまり`T`と`U`の共通部分となる）メンバーを除外して新しい共用体型を作成します。特定のメンバーを除いた共用体型が欲しい場合に便利です。

```ts
type NoteStatus = 'raw' | 'refining' | 'stable' | 'trashed';
type ActiveStatus = Exclude<NoteStatus, 'trashed'>; // 'raw' | 'refining' | 'stable'
```

### `Extract<T, U>`
型`T`から、型`U`に代入可能な（つまり`T`と`U`の共通部分となる）メンバーを抽出して新しい共用体型を作成します。特定のメンバーだけを抜き出したい場合に便利です。

```ts
type AllColors = 'red' | 'green' | 'blue' | 'yellow';
type PrimaryColors = 'red' | 'blue';

type ExtractedColors = Extract<AllColors, PrimaryColors>; // 'red' | 'blue'
```

### `Readonly<T>`
全てのプロパティを読み取り専用（`readonly`）にするユーティリティ型です。オブジェクトの内容が不変であることを保証したい場合や、関数に渡すオブジェクトが変更されないようにしたい場合に利用します。

```ts
type ReadonlyNote = Readonly<Note>;
// 結果の型:
// {
//   readonly id: string;
//   readonly title: string;
//   readonly status: 'raw' | 'refining' | 'stable' | 'trashed';
//   readonly createdAt: Date;
//   readonly updatedAt: Date;
//   readonly sha: string;
// }

const myNote: ReadonlyNote = { /* ...初期値... */ };
// myNote.title = '新しいタイトル'; // エラー: 読み取り専用プロパティであるため、'title' に代入することはできません。
```

### `NonNullable<T>`
型`T`から`null`と`undefined`を除外するユーティリティ型です。型が`null`や`undefined`を含む可能性がある場合に、それらを取り除いた型が必要なときに使われます。

```ts
type CanBeNull = string | null | undefined;
type NotNull = NonNullable<CanBeNull>; // string
```

---

これらのユーティリティ型を適切に使いこなすことで、TypeScriptの型システムをより強力に活用し、堅牢で読みやすいコードを書くことができます。それぞれの型がどのような目的で使われるかを理解し、日々の開発に役立ててください。
