export type Verdict = {
  label: string;
  verdict: string;
  roast: string;
  color: string;
};

export const VERDICTS: Verdict[] = [
  { label: '安全',       verdict: '神記事',            roast: '息をするように有益。これを無料で読める世界に感謝。',                                    color: '#1D9E75' }, // 0-4
  { label: '安全',       verdict: '優良記事',           roast: '「稼げる」という単語がない世界線。真面目すぎて逆に心配になる。',                        color: '#1D9E75' }, // 5-9
  { label: '安全',       verdict: 'まともな記事',        roast: 'こういうのでいいんだよ、こういうので。地に足のついた真っ当な記事。',                    color: '#1D9E75' }, // 10-14
  { label: '安全',       verdict: 'まあ普通',            roast: '特に問題なし。強いて言えば文章が長い。',                                                  color: '#5DCAA5' }, // 15-19
  { label: '概ね安全',   verdict: '普通の記事',          roast: '可もなく不可もなく。読んだ5分後に内容を忘れる平和な記事。',                              color: '#5DCAA5' }, // 20-24
  { label: '概ね安全',   verdict: '少し薄い',            roast: '悪気はないんだろうけど、どこかで読んだことある内容の詰め合わせ。',                      color: '#5DCAA5' }, // 25-29
  { label: '概ね安全',   verdict: '少し盛ってる',        roast: '嘘はついてないが、実力を1.5倍に見せようとする涙ぐましい努力を感じる。',                  color: '#5DCAA5' }, // 30-34
  { label: '概ね安全',   verdict: 'やや怪しい',          roast: '「最短最速」の気配がする。お前もそっち側に行ってしまうのか？',                            color: '#EF9F27' }, // 35-39
  { label: 'やや怪しい', verdict: '怪しい匂いがする',    roast: 'ろくろを回しながらポエムを語り始めた。核心のノウハウはどこに行った？',                  color: '#EF9F27' }, // 40-44
  { label: 'やや怪しい', verdict: 'かなり怪しい',        roast: '「僕はこれで成功しました（※ただし運と才能による）」。再現性ゼロ。',                    color: '#EF9F27' }, // 45-49
  { label: 'やや怪しい', verdict: '惜しいクソ記事',      roast: '急に自分語りの逆転ストーリー始めるのやめろ。ノウハウだけ置いとけ。',                    color: '#EF9F27' }, // 50-54
  { label: 'やや怪しい', verdict: 'クソ寄りの微妙',      roast: '熱さは伝わった。で、結局何？中身の薄さをエモさで誤魔化すな。',                            color: '#EF9F27' }, // 55-59
  { label: '危険',       verdict: 'クソ記事候補',        roast: 'noteやBrainで5万回見たテンプレ構成。親の顔より見た「実績公開」。',                      color: '#E24B4A' }, // 60-64
  { label: '危険',       verdict: 'ほぼクソ',            roast: '「誰でも初月で30万」？じゃあお前はなんでこの記事売って小銭稼いでるんだよ。',            color: '#E24B4A' }, // 65-69
  { label: '危険',       verdict: 'クソ記事認定',        roast: '読者の不安と射幸心を煽るだけのスパム。Claudeに判定させたAPI代を返せ。',                  color: '#E24B4A' }, // 70-74
  { label: '危険',       verdict: '本格的にクソ',        roast: 'ChatGPTに「儲かる商材のテンプレ書いて」って言った結果そのまま。AIも泣いてるぞ。',        color: '#E24B4A' }, // 75-79
  { label: '極めて危険', verdict: '完全にクソ',          roast: 'ペラペラのPDFに数万円の値札が付く幻覚が見える。絶対にお布施してはいけない。',          color: '#A32D2D' }, // 80-84
  { label: '極めて危険', verdict: '上級クソ記事',        roast: 'サーバー容量の無駄。これに金払うくらいならその辺の犬に札束食わせた方がマシ。',          color: '#A32D2D' }, // 85-89
  { label: '極めて危険', verdict: '神クソ記事',          roast: '詐欺師が情弱を狩るための教典。ある意味、芸術点が高い。',                                color: '#A32D2D' }, // 90-94
  { label: '殿堂入り',   verdict: '殿堂入りクソ記事',    roast: '即刻通報レベル。人類の知性を衰退させる劇薬なので今すぐブラウザを閉じろ。',              color: '#791F1F' }, // 95-100
];

export function getVerdict(total: number): Verdict {
  const index = total === 100 ? 19 : Math.floor(total / 5);
  return VERDICTS[Math.min(index, 19)];
}
