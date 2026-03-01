import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { auth } from '@/lib/auth'
import { CATEGORY_LABELS } from '@/lib/constants'
import type { NoteCategory } from '@/types/note'

interface InsightRequest {
  totalNotes: number
  promotionRate: number
  avgMaturationDays: number | null
  abandonRate: number
  peakTimeLabel: string
  stagnantNoteCount: number
  perennialCandidateCount: number
  topCategory: NoteCategory | null
  weakCategory: NoteCategory | null
  categoryRates: { category: NoteCategory; rate: number; total: number }[]
  stagnantNoteTitles: string[]
  perennialCandidateTitles: string[]
}

export interface InsightResult {
  tendency: string
  strength: string
  focus: string
  challenge: string
  advice: string
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY が設定されていません' },
      { status: 503 }
    )
  }

  const body = (await req.json()) as InsightRequest

  // 派生指標をサーバー側で計算してAIに渡す
  const stagnantRate = body.totalNotes > 0
    ? Math.round((body.stagnantNoteCount / body.totalNotes) * 100)
    : 0
  const perennialRate = body.totalNotes > 0
    ? Math.round((body.perennialCandidateCount / body.totalNotes) * 100)
    : 0
  const vitality = body.promotionRate - body.abandonRate  // 活性度スコア
  const categoryRateValues = body.categoryRates.map((c) => c.rate)
  const categoryVariance = categoryRateValues.length > 1
    ? Math.round(
        categoryRateValues.reduce((sum, r) => {
          const avg = categoryRateValues.reduce((a, b) => a + b, 0) / categoryRateValues.length
          return sum + Math.pow(r - avg, 2)
        }, 0) / categoryRateValues.length
      )
    : 0

  const categoryRateText = body.categoryRates
    .map((c) => `${CATEGORY_LABELS[c.category]}:${c.rate}%(${c.total}件)`)
    .join(', ')

  const dataText = [
    `【基本統計】`,
    `全メモ数: ${body.totalNotes}件`,
    `昇華率(stable到達率): ${body.promotionRate}%`,
    `平均熟成日数: ${body.avgMaturationDays !== null ? `${body.avgMaturationDays}日` : 'データなし'}`,
    `廃棄率(宿根移行率): ${body.abandonRate}%`,
    `活性度スコア(昇華率−廃棄率): ${vitality > 0 ? '+' : ''}${vitality}`,
    ``,
    `【滞留分析】`,
    `停滞ノート(整理中14日以上): ${body.stagnantNoteCount}件 (全体の${stagnantRate}%)`,
    `宿根候補(7日以上放置): ${body.perennialCandidateCount}件 (全体の${perennialRate}%)`,
    ``,
    `【カテゴリ分析】`,
    `最も昇華率の高いカテゴリ: ${body.topCategory ? CATEGORY_LABELS[body.topCategory] : 'なし'}`,
    `昇華率の低いカテゴリ: ${body.weakCategory ? CATEGORY_LABELS[body.weakCategory] : 'なし'}`,
    `カテゴリ別昇華率: ${categoryRateText}`,
    `カテゴリ間の昇華率分散: ${categoryVariance}(高いほどカテゴリ間のムラが大きい)`,
    ``,
    `【行動パターン】`,
    `最もメモする時間帯: ${body.peakTimeLabel}`,
    ``,
    `【放置中のメモ（タイトル）】`,
    body.stagnantNoteTitles.length > 0
      ? body.stagnantNoteTitles.map((t) => `・${t}`).join('\n')
      : '（なし）',
    ``,
    `【長期間触れていないメモ（タイトル）】`,
    body.perennialCandidateTitles.length > 0
      ? body.perennialCandidateTitles.map((t) => `・${t}`).join('\n')
      : '（なし）',
  ].join('\n')

  const prompt = `あなたは知識管理と認知科学に精通したパーソナルコーチAIです。
以下のアプリの目的とコンセプトを前提として、ユーザーデータを統計的に分析し、具体的なアドバイスを生成してください。

【このアプリについて】
「芽吹き」は、思考を育てるためのメモ管理アプリです。
メモは3段階で成長します：
  1. 生メモ（アイデアの断片・走り書き）
  2. 整理中（構造化・肉付けが進んでいる状態）
  3. 完成（十分な深さと完成度がある思考）
完成したメモはアーカイブに移動し、思考の財産として蓄積されます。
長期間放置されたメモは「休眠メモ」として別管理されます（削除ではなく保留）。
このアプリの目的は「メモを書くこと」ではなく「思考を育てて完成させること」です。

【用語の意味（分析時の参考として）】
- 昇華率 = メモが「完成」まで到達した割合
- 平均熟成日数 = 生メモから完成になるまでの平均日数
- 廃棄率 = 休眠メモに移行した割合
- 活性度スコア = 昇華率 − 廃棄率（メモを完成させる勢いと、放置に移る割合のバランス）
- 停滞ノート = 整理中のまま2週間以上更新されていないメモ
- 宿根候補 = 1週間以上触れていない生メモ・整理中メモ

【ユーザーデータ】
${dataText}

【分析の視点（必ず考慮すること）】
1. 完成率の参考値: 20%以下=初期段階、30〜50%=成長中、50%超=習熟
2. 平均熟成日数: 3日以下=性急すぎる可能性、7〜14日=理想的、30日超=停滞傾向
3. 活性度スコア: プラス=成長局面、マイナス=整理が追いついていない
4. 停滞率10%超は習慣面に課題あり、5%未満は健全
5. カテゴリ別の差が大きい場合、得意分野の伸ばし方 vs 苦手分野の改善を提案
6. 【重要】放置中・長期放置のメモについて：「見直す」「整理する」「処理する」という指示は絶対にしないこと。
   代わりにメモのタイトルから内容を推測し、「このアイデアとあのアイデアを組み合わせると〇〇できそう」のように
   アイデア同士のつながりや発展の可能性を具体的に提案すること。
   放置は問題ではなく「まだ育ちきっていない種」として捉え、可能性として語ること。

【出力ルール】
- tendency: 現在の状態を統計的観点から分析した総評（データの数字を引用、2〜3文）
- strength: データから読み取れる最大の強み（具体的な数値根拠付き、1〜2文）
- focus: 思考の深め方に関するヒント（「〜してみると」「〜を考えると」のような柔らかい提案、行動を強制しない、1文）
- challenge: 長期間触れていないメモのタイトルと、完成率の高いカテゴリのテーマを結びつけた発想のヒント。
  「AのアイデアとBのアイデアを組み合わせると〇〇という視点が生まれそう」のような具体的なつながりの提案。
  行動指示・タスク・「〜してください」は絶対に使わない。あくまで「気づきのきっかけ」として提示する（1〜2文）
- advice: データから読み取れるメモの書き方・育て方の特徴を、誰でも理解できる言葉で説明する（2〜3文。専門用語不使用）
- tendencyは150文字以内、strengthは100文字以内、focus/challengeは120文字以内、adviceは200文字以内
- 【重要】アプリ固有の専門用語・抽象的な造語は一切使わないこと。具体的に禁止する語と言い換え例：
  「昇華率」→「メモが完成まで到達した割合（完成率）」
  「宿根候補」→「しばらく触れていないメモ」
  「熟成日数」→「メモが完成するまでにかかった日数」
  「思考活動の健全度」→「メモの完成と放置のバランス」や「メモを育てる勢い」など文脈に合わせた表現
  「活性度スコア」→出力には使わない。内容を言葉で説明する
  「停滞ノート」→「しばらく更新が止まっているメモ」
  「廃棄率」→「休眠メモに移った割合」
- 数字を引用する場合は必ず単位・文脈をセットにすること（「完成率30%」「10件のうち3件が完成済み」など）
- 「〜してください」「〜すべき」「〜を見直す」などの指示・命令形は全フィールドで使用禁止
- 挨拶・まとめ不要。ネガティブより「可能性」として表現
- JSON形式のみ（余分なテキストなし）

【出力形式】
{"tendency":"...","strength":"...","focus":"...","challenge":"...","advice":"..."}`

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error(`JSONが見つかりません: ${text.slice(0, 200)}`)

    const parsed = JSON.parse(jsonMatch[0]) as InsightResult

    return NextResponse.json(parsed)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('AI insight error:', msg)
    return NextResponse.json({ error: `AIインサイトの生成に失敗しました: ${msg}` }, { status: 500 })
  }
}
