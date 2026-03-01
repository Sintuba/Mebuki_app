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

  const prompt = `あなたは「思考の成熟度システム」のAIレビュアーです。ノートは3段階で管理されています：
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
      "reason": "判断理由（日本語で1〜2文）",
      "newStatus": "変更後のステータス名",
      "suggestion": "校正・改善後のMarkdown本文（元の構造を活かしつつ、表現・整理・補足を改善した完全な本文）",
      "changeSummary": "変更内容を端的に示す1文（例：「見出しを再構成し、コード例を追加」「文体を統一し、箇条書きを整理」）"
    }
  ]
}

判断基準：
- promote: 内容が現ステータスを超えており、次のステージに進む準備ができている
- keep: 現ステータスが適切、またはさらに成熟が必要
- stableのノートは必ずkeep（newStatusはstable）

suggestionについて：
- 元の内容を読み取り、表現の改善・構造の整理・補足情報の追加を行ったMarkdown本文を出力する
- 元の意図・内容を変えず、より読みやすく・充実した形に仕上げる
- frontmatterは含めず、本文（content）のみ出力する
- 改善点がほぼない場合も、軽微な調整を加えた本文を返す

changeSummaryについて：
- suggestionで行った変更を日本語1文で端的に要約する（20〜40文字程度）
- 「〜を改善」「〜を追加」「〜を整理」のような形式で変更の種類が分かるように書く`;

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
