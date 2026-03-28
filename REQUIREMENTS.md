# クソ記事チェッカー 要件定義書

## プロジェクト概要

AI・情報商材系の怪しい記事を判定するWebアプリ。
テキスト貼り付けまたはURLを入力すると、6軸でクソ度をスコアリングして表示する。

- サービス名：**クソ記事チェッカー**
- 参考UI：サクラチェッカー（https://sakura-checker.jp）
- 技術スタック：Next.js 14 (App Router) + Vercel
- 既存環境：Spider Solitaire と同じ Vercel アカウント・GitHub リポジトリ構成

---

## ディレクトリ構成

```
kuso-checker/
├── app/
│   ├── layout.tsx
│   ├── page.tsx               # メインUI
│   ├── globals.css
│   └── api/
│       ├── check/
│       │   └── route.ts       # 判定API（Claude API呼び出し）
│       └── fetch-url/
│           └── route.ts       # URL取得API（サーバー側でfetch）
├── components/
│   ├── InputPanel.tsx         # テキスト/URL入力フォーム
│   ├── ResultPanel.tsx        # 判定結果表示（全体レイアウト）
│   ├── ScoreMeter.tsx         # メインスコアメーター（横棒）
│   ├── RadarChart.tsx         # 5項目レーダーチャート（Chart.js）
│   └── EvidenceList.tsx       # 検出フレーズ一覧
├── lib/
│   ├── rateLimit.ts           # レートリミット（Upstash Redis or in-memory）
│   ├── prompt.ts              # Claude APIへのシステムプロンプト・モデル選択
│   ├── score.ts               # calcTotal()・calcDisplayScores()・getVerdict()
│   └── verdicts.ts            # 判定台本（スコア帯ごとのverdict・roast）
├── .env.local                 # ANTHROPIC_API_KEY など
├── next.config.js
├── package.json
└── README.md
```

---

## 機能要件

### 1. 入力

**タブ切り替えで2モード対応**

#### テキストモード
- `<textarea>` に記事本文・タイトル・SNS投稿などを貼り付け
- 最大文字数：20,000文字（超過時はエラー表示）

#### URLモード
- `<input type="text">` にURLを入力
- サーバー側 `/api/fetch-url` でページ本文を取得
- `cheerio` でHTMLをパース → テキスト抽出
- タイムアウト：10秒
- エラー時のメッセージ：
  - ログイン必須ページ → 「このページは取得できませんでした。テキストタブから直接貼り付けてください。」
  - タイムアウト → 「ページの取得に時間がかかりすぎました。」

### 2. 判定API（`/api/check`）

**Claude API（claude-sonnet-4-20250514）を呼び出してJSONを返す**

#### モデル選択戦略（コスト最適化）

入力トークン数に応じてモデルを自動切り替えする。

| 入力トークン数 | 使用モデル | 理由 |
|---|---|---|
| 〜1,000トークン | `claude-haiku-4-5-20251001` | SNS投稿・短文は品質差が小さい |
| 1,001トークン〜 | `claude-sonnet-4-20250514` | 長文・複雑な記事は深い分析が必要 |

- 判定前にトークン数を概算（文字数 ÷ 2 で近似）
- `lib/prompt.ts` の `selectModel(inputLength: number)` 関数で切り替え

#### 判定軸（8軸確定版）と重み付け

`total` スコアはAIに計算させず、フロント側で以下の重み付き計算式で算出する。

```typescript
// lib/score.ts
export function calcTotal(scores: AxisScores): number {
  return Math.round(
    scores.harm             * 0.22 +
    scores.exaggeration     * 0.18 +
    scores.n1hype           * 0.15 +
    scores.originality      * 0.13 +
    scores.solution_hiding  * 0.13 +
    scores.social_proof_fake* 0.08 +
    scores.ai_slop          * 0.06 +
    scores.clickbait        * 0.05
  );
}
```

| 軸 | 重み | 概念・検出パターン |
|---|---|---|
| `harm` | 22% | 読者が金銭・時間・精神的に損するリスク |
| `exaggeration` | 18% | 「月収100万」「誰でも」「今すぐ」「爆速」「神」等の過剰表現 |
| `n1hype` | 15% | 自分1人の体験→「誰でもできる」への論理飛躍。生存バイアス無視 |
| `originality` | 13% | 二次情報の切り貼り・AI正論の寄せ集め・他サイトの焼き直し |
| `solution_hiding` | 13% | 「続きはLINEで」「詳しくはDMで」「個別相談はこちら」等の後出し誘導 |
| `social_proof_fake` | 8% | 「累計〇〇部」「満足度98%」「口コミ多数」等の検証不可能な実績。レビュアーへのアフィリバック構造 |
| `ai_slop` | 6% | 均質な文体・具体例なし・「〜といえるでしょう」系の量産コンテンツ臭 |
| `clickbait` | 5% | タイトルと中身の乖離。「知らないとヤバイ」「〇〇の真実」等の釣りタイトル |

#### システムプロンプト（`lib/prompt.ts` に定義）

`verdict`・`roast`・`total` はAIに生成・計算させない（台本と重み付き計算式で処理）。
AIはスコア数値・`comment`・`merit`・`evidence`・`price_warning` のみ返す。

```
あなたは「クソ記事・情報商材判定AI」です。
入力テキストを以下の8軸で判定し、JSONのみを返してください（前置き・説明・バッククォート不要）。

判定軸（各0〜100、高いほどクソ）:
1. harm: 有害度（読者が金銭・時間・精神的に損するリスク）
2. exaggeration: 誇大表現（「月収100万」「誰でも」「今すぐ」「爆速」「神」等）
3. n1hype: N1誇大体験談（自分1人の体験→「誰でもできる」への論理飛躍。生存バイアス無視）
4. originality: 一次情報度の低さ（二次情報の切り貼り・AI正論の寄せ集め・他サイトの焼き直し）
5. solution_hiding: 解決策の後出し（「続きはLINEで」「詳しくはDMで」等の本質情報の隠蔽）
6. social_proof_fake: 偽ソーシャルプルーフ（「累計〇〇部」「満足度98%」等の検証不可能な実績。アフィリバック構造による評価水増し）
7. ai_slop: AI生成丸出し度（均質文体・具体例なし・量産コンテンツ臭）
8. clickbait: タイトル釣り度（タイトルと中身の乖離・「知らないとヤバイ」系）

返却JSON（totalは含めない）:
{
  "harm": 0〜100,
  "exaggeration": 0〜100,
  "n1hype": 0〜100,
  "originality": 0〜100,
  "solution_hiding": 0〜100,
  "social_proof_fake": 0〜100,
  "ai_slop": 0〜100,
  "clickbait": 0〜100,
  "comment": "辛口総評（100文字以内）",
  "merit": "良い点があれば記載、なければnull（60文字以内）",
  "evidence": ["問題フレーズや構造的問題を3〜5個"],
  "price_warning": "値段への言及があれば評価、なければnull"
}
```

#### レスポンス例

```json
{
  "harm": 60,
  "exaggeration": 80,
  "n1hype": 85,
  "originality": 65,
  "solution_hiding": 40,
  "social_proof_fake": 78,
  "ai_slop": 20,
  "clickbait": 78,
  "comment": "レビュー者へのアフィリバック構造により評価4.9の信憑性がゼロ。実在する手法の寄せ集めだが「誰でも・スキルなし・今すぐ」の乱用が目立つ。",
  "merit": "座談会・在宅ワーク案件の具体リストは実用的。7万字の情報量は一定の価値あり。",
  "evidence": ["累計5900部・評価4.9（アフィリバック報酬で水増し）", "月110万を稼いでいます（生存バイアス）", "日本一、楽な副業だと思います", "追記ごとに値上げ予定"],
  "price_warning": "Brain（情報商材プラットフォーム）での販売。レビュアーがアフィリ報酬を得る構造により評価の信頼性が著しく低い。"
}
```

#### 判定台本（`lib/verdicts.ts` に定義）

`verdict`・`roast` はAIに生成させず、`total` スコアに応じて固定セリフを返す。
トーンが常に安定し、出力トークンも削減できる。

```typescript
// lib/verdicts.ts
export type Verdict = { label: string; verdict: string; roast: string; color: string; };

export const VERDICTS: Verdict[] = [
  { label: '安全',       verdict: '優良記事',         roast: '保存した。久しぶりに見た人間の仕事。',                         color: '#1D9E75' },
  { label: '安全',       verdict: 'まともな記事',      roast: '根拠がある。数字がある。奇跡か。',                             color: '#1D9E75' },
  { label: '概ね安全',   verdict: '普通の記事',        roast: '可もなく不可もなく。でもクソではない。それだけで偉い。',       color: '#5DCAA5' },
  { label: '概ね安全',   verdict: '少し盛ってる',      roast: '嘘ではないが、1.3倍くらい盛ってる。人間らしい。',             color: '#5DCAA5' },
  { label: 'やや怪しい', verdict: '怪しい匂いがする',  roast: '根拠が薄い。でも詐欺とは言い切れない。グレーゾーンの住人。', color: '#EF9F27' },
  { label: 'やや怪しい', verdict: '惜しいクソ記事',    roast: 'いい情報も混じってる。でも「僕は3ヶ月で〇〇した」が余計。黙っとけ。', color: '#EF9F27' },
  { label: '危険',       verdict: 'クソ記事候補',      roast: 'お前もか。また同じパターンか。AIは悪くない、使う人間が悪い。', color: '#E24B4A' },
  { label: '危険',       verdict: 'クソ記事認定',      roast: '読んだ時間を返してほしい。Claudeに判定させた時間も返してほしい。', color: '#E24B4A' },
  { label: '極めて危険', verdict: '完全にクソ',        roast: '情報商材の教科書に載せたい。反面教師として。',                color: '#A32D2D' },
  { label: '極めて危険', verdict: '神クソ記事',        roast: 'ここまで来ると逆に才能。クソの純度が高すぎる。',              color: '#A32D2D' },
  { label: '殿堂入り',   verdict: '殿堂入りクソ記事',  roast: '永久保存版。後世に残すべきクソの金字塔。',                   color: '#791F1F' },
];

// スコア → 台本インデックスの対応
// 0-9:0, 10-19:1, 20-29:2, 30-39:3, 40-49:4, 50-59:5,
// 60-69:6, 70-79:7, 80-89:8, 90-99:9, 100:10
export function getVerdict(total: number): Verdict {
  const index = total === 100 ? 10 : Math.floor(total / 10);
  return VERDICTS[Math.min(index, 10)];
}
```

### 3. 結果表示UI

**サクラチェッカー風レイアウト**

#### 設計方針：8軸判定・5項目表示
内部では8軸で判定して精度を保ちつつ、UIには5項目にグルーピングして表示する。
レーダーチャートの形で「このコンテンツの歪み方」が一目でわかる設計。
競合ツールが軸構成を模倣しにくくなる副次効果もある。

#### 5項目グルーピング計算（`lib/score.ts`）

```typescript
export function calcDisplayScores(s: AxisScores): DisplayScores {
  return {
    煽り誇大:    Math.round(s.exaggeration * 0.7 + s.clickbait * 0.3),
    実績の怪しさ: Math.round(s.n1hype * 0.6 + s.social_proof_fake * 0.4),
    情報の薄さ:  Math.round(s.originality * 0.6 + s.ai_slop * 0.4),
    囲い込み:   s.solution_hiding,
    有害度:     s.harm,
  };
}
```

| 表示名 | 内訳 | 典型パターン |
|---|---|---|
| 煽り・誇大 | `exaggeration`×0.7 + `clickbait`×0.3 | 「月収100万」「知らないとヤバイ」 |
| 実績の怪しさ | `n1hype`×0.6 + `social_proof_fake`×0.4 | 生存バイアス・アフィリバック評価 |
| 情報の薄さ | `originality`×0.6 + `ai_slop`×0.4 | 二次情報の切り貼り・AI量産 |
| 囲い込み | `solution_hiding` | 「続きはLINEで」後出し誘導 |
| 有害度 | `harm` | 読者への金銭・時間的実害リスク |

#### ヘッダーエリア
- 危険度バッジ（色付きpill）：極めて危険 / 危険 / やや怪しい / 概ね安全 / 安全
- スコア大表示（アニメーションカウントアップ）
- 一言判定 + 毒舌コメント（italic・台本から取得）

#### レーダーチャートエリア
- 5項目を正五角形のレーダーチャートで表示
- ライブラリ：Chart.js（`radar` タイプ）
- スコアが高いほど外側に広がる（クソ記事ほど歪んだ五角形になる）
- 塗り色：`rgba(226, 75, 74, 0.2)`（赤の薄塗り）、枠線：`#E24B4A`
- アニメーション：描画時にぬるっと広がる（Chart.js デフォルトアニメーション）
- 軸ラベルは日本語5項目を表示

#### メーターエリア
- 横棒メーター（0〜100、4段階ラベル付き）
- スコアに応じて色が変化（緑→黄→赤）

#### 総評エリア
- `comment` を表示
- `merit` が存在する場合は「救いポイント」ボックスを緑背景で追加表示

#### 検出フレーズエリア
- `evidence` の各項目を左ボーダー付きカードで表示

#### 値段評価エリア（条件付き）
- `price_warning` が存在する場合のみ表示（黄色背景ボックス）

#### 危険度レベル定義
| スコア | ラベル | カラー |
|---|---|---|
| 80〜100 | 極めて危険 | 赤 #E24B4A |
| 60〜79 | 危険 | オレンジ #EF9F27 |
| 40〜59 | やや怪しい | 黄 #EF9F27（薄め） |
| 20〜39 | 概ね安全 | 緑 #1D9E75 |
| 0〜19 | 安全 | 緑 #1D9E75（濃め） |

### 4. レートリミット

**IPアドレスベースで制限**

- 実装：Vercel KV（Upstash Redis）を使用
  - Vercel無料枠で利用可能
  - `@vercel/kv` パッケージ
- 制限値：**1IPあたり1日20回**（JST 0時リセット）
- 超過時のレスポンス：HTTP 429 + `{ "error": "1日の利用上限（20回）に達しました。明日またご利用ください。" }`
- フォールバック：KV接続失敗時はin-memoryで代替（開発環境用）

### 5. OGP / SEO

```html
<title>クソ記事チェッカー｜AI・情報商材の危険度を判定</title>
<meta name="description" content="AIや副業系の怪しい記事・情報商材を6軸でスコアリング。誇大表現・N1体験談・有害度などを判定します。" />
<meta property="og:title" content="クソ記事チェッカー" />
<meta property="og:description" content="AIや副業系の怪しい記事の危険度を判定するツール" />
```

---

## 非機能要件

### パフォーマンス
- Claude API呼び出しはストリーミング不要（JSON完全受信後に描画）
- URL取得のタイムアウト：10秒
- 判定APIのタイムアウト：Vercelデフォルト（30秒）

### セキュリティ
- `ANTHROPIC_API_KEY` は必ずサーバーサイドのみ（`NEXT_PUBLIC_` プレフィックスを付けない）
- URL取得時は `localhost`・プライベートIPへのアクセスをブロック（SSRF対策）
- 入力値のサニタイズ（XSS対策）

### エラーハンドリング
| ケース | 表示メッセージ |
|---|---|
| 入力が空 | 「テキストを入力してください」 |
| 文字数超過 | 「20,000文字以内で入力してください」 |
| URL取得失敗 | 「ページを取得できませんでした。テキストタブから貼り付けてください。」 |
| APIエラー | 「判定に失敗しました。もう一度お試しください。」 |
| レートリミット超過 | 「本日の利用上限（20回）に達しました。明日またご利用ください。」 |

---

## 環境変数（`.env.local`）

```
ANTHROPIC_API_KEY=sk-ant-...
KV_REST_API_URL=...          # Vercel KV（レートリミット用）
KV_REST_API_TOKEN=...
```

---

## デプロイ手順

1. `npx create-next-app@latest kuso-checker` で初期化
2. 上記ファイル構成に従って実装
3. Vercel KVをダッシュボードから作成してプロジェクトに接続
4. `ANTHROPIC_API_KEY` を Vercel 環境変数に設定
5. GitHub にプッシュ → Vercel が自動デプロイ

---

## 実装の優先順位

| 優先度 | 機能 |
|---|---|
| 必須 | テキスト入力 → 判定 → 結果表示 |
| 必須 | レートリミット（KV） |
| 必須 | レスポンシブ対応 |
| 推奨 | URL取得機能 |
| 推奨 | OGP設定 |
| 任意 | 判定結果のシェアボタン（X投稿） |
| 任意 | 過去の判定履歴（localStorage） |

---

## 収益化・将来構想メモ

### 訴訟リスク対策
- 免責事項ページを必ず用意（「AIによる自動分析であり運営者の意見ではない」「参考情報として活用してください」）
- 判定結果は「断定」ではなく「スコア＋分析軸」の形式を維持
- サクラチェッカーの参考：開発者の実名・経歴を公開することで信頼性を担保
- ブラックリストの公開表示は避ける（URLキャッシュはOK、公開リスト化はNG）

### 「安全認定バッジ」構想（逆張り収益化）
クソ記事を批判するツールが、良質コンテンツの流通チャネルになるモデル。

- **無料バッジ**：スコア20以下で「クソ記事チェッカー安全認定」バッジを自動発行
  - SVG埋め込みコード or 画像URLを発行
  - コンテンツ制作者が自分から拡散 → ツール認知拡大
- **有料バッジ**（将来）：¥500〜¥1,000で埋め込みウィジェットを発行
  - 「このコンテンツはAIによる品質チェック済み」という信頼性の証明
- **広告枠**（将来）：低スコア判定結果ページに安全認定済みコンテンツを表示
  - クソ記事を避けたいユーザー × 良質コンテンツを届けたい制作者をつなぐ

### 判定ログ・ブラックリスト構想
- 保存するのは「URLとスコアのみ」（テキスト本文は保存しない、プライバシー対策）
- 同一URLが3回以上判定 かつ スコア70以上 → 自動キャッシュ（API節約）
- キャッシュ済み判定はAPIを叩かずに即返す
- 将来的に「最近よく判定されている記事」をトップに表示 → SEO効果も期待
