export type Verdict = {
  label: string;
  verdict: string;
  roast: string;
  color: string;
};

export const VERDICTS: Verdict[] = [
  { label: '安全',       verdict: '優良記事',         roast: '保存した。久しぶりに見た人間の仕事。',                               color: '#1D9E75' },
  { label: '安全',       verdict: 'まともな記事',      roast: '根拠がある。数字がある。奇跡か。',                                   color: '#1D9E75' },
  { label: '概ね安全',   verdict: '普通の記事',        roast: '可もなく不可もなく。でもクソではない。それだけで偉い。',             color: '#5DCAA5' },
  { label: '概ね安全',   verdict: '少し盛ってる',      roast: '嘘ではないが、1.3倍くらい盛ってる。人間らしい。',                   color: '#5DCAA5' },
  { label: 'やや怪しい', verdict: '怪しい匂いがする',  roast: '根拠が薄い。でも詐欺とは言い切れない。グレーゾーンの住人。',       color: '#EF9F27' },
  { label: 'やや怪しい', verdict: '惜しいクソ記事',    roast: 'いい情報も混じってる。でも「僕は3ヶ月で〇〇した」が余計。黙っとけ。', color: '#EF9F27' },
  { label: '危険',       verdict: 'クソ記事候補',      roast: 'お前もか。また同じパターンか。AIは悪くない、使う人間が悪い。',     color: '#E24B4A' },
  { label: '危険',       verdict: 'クソ記事認定',      roast: '読んだ時間を返してほしい。Claudeに判定させた時間も返してほしい。', color: '#E24B4A' },
  { label: '極めて危険', verdict: '完全にクソ',        roast: '情報商材の教科書に載せたい。反面教師として。',                     color: '#A32D2D' },
  { label: '極めて危険', verdict: '神クソ記事',        roast: 'ここまで来ると逆に才能。クソの純度が高すぎる。',                   color: '#A32D2D' },
  { label: '殿堂入り',   verdict: '殿堂入りクソ記事',  roast: '永久保存版。後世に残すべきクソの金字塔。',                         color: '#791F1F' },
];

export function getVerdict(total: number): Verdict {
  const index = total === 100 ? 10 : Math.floor(total / 10);
  return VERDICTS[Math.min(index, 10)];
}
