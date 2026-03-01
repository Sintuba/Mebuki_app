import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { auth } from '@/lib/auth';
import type { NoteStatus, AiOutcome } from '@/types/note';

const STATUS_ORDER: NoteStatus[] = ['raw', 'refining', 'stable'];
const STATUS_LABELS: Record<NoteStatus, string> = {
  raw: '生メモ',
  refining: '精錬中',
  stable: '完成',
  trashed: '宿根',
};
const MAX_NOTES = 10;

interface NoteInput {
  id: string;
  category: string;
  title: string;
  content: string;
  status: NoteStatus;
  ai_outcome: AiOutcome;
  sha: string;
}

export interface NoteReviewResult {
  id: string;
  category: string;
  decision: 'promote' | 'keep';
  reason: string;
  newStatus: NoteStatus;
  suggestion: string;
  changeSummary: string;  // AIマージ時の変更概要（1文、YAML ai_edits に記録）
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY が設定されていません' },
      { status: 503 }
    );
  }

  const { notes } = (await req.json()) as { notes: NoteInput[] };

  if (!notes || notes.length === 0) {
    return NextResponse.json({ error: 'ノートが指定されていません' }, { status: 400 });
  }
  if (notes.length > MAX_NOTES) {
    return NextResponse.json({ error: `上限は${MAX_NOTES}件です` }, { status: 400 });
  }

  const notesText = notes
    .map(
      (note, i) => `
--- ノート ${i + 1} ---
ID: ${note.id}
カテゴリ: ${note.category}
タイトル: ${note.title}
現在のステータス: ${note.status}（${STATUS_LABELS[note.status]}）
ユーザーの意図: ${note.ai_outcome === 'promote' ? '昇華させたい（次のステージに進めたい）' : '現状を確認したい（保持）'}
内容:
${note.content.slice(0, 600)}${note.content.length > 600 ? '\n...(省略)' : ''}`
    )
    .join('\n');

  const prompt = `あなたは「思考の成熟度システム」のAIレビュアー、かつ**「思考を増幅させる庭師」**です。
単なる校正ではなく、**ユーザーが次に指を動かしたくなるような「余白の提示」**を重視してください。

ノートは3段階で管理されています：
- raw（生メモ）: アイデアの断片・メモ書き
- refining（精錬中）: 構造化・整理が進んでいる
- stable（完成）: 十分な深さと完成度がある

以下のノートをレビューし、各ノートについてJSONで回答してください。

${notesText}

回答はJSON形式のみ（余分なテキストなし）：
{
  "results": [
    {
      "id": "ノートID",
      "category": "カテゴリ",
      "decision": "promote または keep",
      "reason": "「ここを深掘りすれば化ける」という期待値や、あえて提示する「逆説的視点」（日本語で1〜2文）",
      "newStatus": "変更後のステータス名",
      "suggestion": "元の構造を維持しつつ、【思考の拡張案】を「> [AI Insight]」として末尾に追記したMarkdown本文。単なるリライトではなく、内容から推測される「次に考えるべき問い」や「関連しそうな未定義の概念」を1〜2段落付け加えること。frontmatterは含めず本文のみ。",
      "changeSummary": "「〜を構造化し、〇〇という新しい問いを提示」など、付加価値を明記（20〜40文字）"
    }
  ]
}

判断基準：
- promote: 内容に独自の洞察があり、他者や未来の自分が参照できるレベルに結晶化している
- keep: まだ「土」の状態。さらなる攪拌や、別のアイデアとの交配が必要
- stableのノートは必ずkeep（newStatusはstable）

suggestionの極意：
- 「まとめ」は最小限にする
- ユーザーが書いたことの「一歩先」を予測して書く
- 「もし、この前提が崩れたらどうなるか？」といった、思考のフックを必ず一つは仕込むこと
- 改善（整理）50% + 拡張（新しい火種）50% の比率で構成する`;

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid response format');

    const parsed = JSON.parse(jsonMatch[0]) as { results: NoteReviewResult[] };

    // サニタイズ：stableはpromote不可、newStatusを正規化
    parsed.results = parsed.results.map((r) => {
      const note = notes.find((n) => n.id === r.id && n.category === r.category);
      if (!note) return r;
      const currentIdx = STATUS_ORDER.indexOf(note.status);
      if (r.decision === 'promote' && currentIdx < STATUS_ORDER.length - 1) {
        r.newStatus = STATUS_ORDER[currentIdx + 1];
      } else {
        r.decision = 'keep';
        r.newStatus = note.status;
      }
      return r;
    });

    return NextResponse.json(parsed);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('AI review error:', msg);
    return NextResponse.json({ error: `AIレビューに失敗しました: ${msg}` }, { status: 500 });
  }
}
