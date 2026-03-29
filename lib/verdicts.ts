export type Verdict = {
  label: string;
  verdict: string;
  roast: string;
  color: string;
};

export const VERDICTS: Verdict[] = [
  { label: '安全',       verdict: '神記事',            roast: '保存した。久しぶりに見た人間の仕事。',                                    color: '#1D9E75' }, // 0-4
  { label: '安全',       verdict: '優良記事',           roast: '根拠がある。数字がある。奇跡か。',                                        color: '#1D9E75' }, // 5-9
  { label: '安全',       verdict: 'まともな記事',        roast: 'ちゃんと書いてある。当たり前のことが当たり前にできている。',              color: '#1D9E75' }, // 10-14
  { label: '安全',       verdict: 'まあ普通',            roast: '特に問題なし。強いて言えば文章が長い。',                                  color: '#5DCAA5' }, // 15-19
  { label: '概ね安全',   verdict: '普通の記事',          roast: '可もなく不可もなく。でもクソではない。それだけで偉い。',                  color: '#5DCAA5' }, // 20-24
  { label: '概ね安全',   verdict: '少し薄い',            roast: '情報はある。でも一次情報じゃない。誰かの受け売り。',                      color: '#5DCAA5' }, // 25-29
  { label: '概ね安全',   verdict: '少し盛ってる',        roast: '嘘ではないが、1.3倍くらい盛ってる。人間らしい。',                        color: '#5DCAA5' }, // 30-34
  { label: '概ね安全',   verdict: 'やや怪しい',          roast: 'そのワード、要る？削ったら普通の記事になるのに。',                        color: '#EF9F27' }, // 35-39
  { label: 'やや怪しい', verdict: '怪しい匂いがする',    roast: '根拠が薄い。でも詐欺とは言い切れない。グレーゾーンの住人。',             color: '#EF9F27' }, // 40-44
  { label: 'やや怪しい', verdict: 'かなり怪しい',        roast: 'N1体験談をN∞に見せるのやめろ。お前だけだ。',                           color: '#EF9F27' }, // 45-49
  { label: 'やや怪しい', verdict: '惜しいクソ記事',      roast: 'いい情報も混じってる。でも「僕は3ヶ月で〇〇した」が余計。黙っとけ。',    color: '#EF9F27' }, // 50-54
  { label: 'やや怪しい', verdict: 'クソ寄りの微妙',      roast: '読んで損はしないが、得もしない。時間の使い方を考えろ。',                 color: '#EF9F27' }, // 55-59
  { label: '危険',       verdict: 'クソ記事候補',        roast: 'お前もか。また同じパターンか。AIは悪くない、使う人間が悪い。',            color: '#E24B4A' }, // 60-64
  { label: '危険',       verdict: 'ほぼクソ',            roast: '「誰でも」って書いた瞬間に嘘になる。お前だけだ。',                        color: '#E24B4A' }, // 65-69
  { label: '危険',       verdict: 'クソ記事認定',        roast: '読んだ時間を返してほしい。Claudeに判定させた時間も返してほしい。',        color: '#E24B4A' }, // 70-74
  { label: '危険',       verdict: '本格的にクソ',        roast: 'これに金払うならClaudeに課金しろ。',                                      color: '#E24B4A' }, // 75-79
  { label: '極めて危険', verdict: '完全にクソ',          roast: '情報商材の教科書に載せたい。反面教師として。',                            color: '#A32D2D' }, // 80-84
  { label: '極めて危険', verdict: '上級クソ記事',        roast: '被害者が目に浮かぶ。やめろ。',                                            color: '#A32D2D' }, // 85-89
  { label: '極めて危険', verdict: '神クソ記事',          roast: 'ここまで来ると逆に才能。クソの純度が高すぎる。',                          color: '#A32D2D' }, // 90-94
  { label: '殿堂入り',   verdict: '殿堂入りクソ記事',    roast: '永久保存版。後世に残すべきクソの金字塔。',                               color: '#791F1F' }, // 95-100
];

export function getVerdict(total: number): Verdict {
  const index = total === 100 ? 19 : Math.floor(total / 5);
  return VERDICTS[Math.min(index, 19)];
}
