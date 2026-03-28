export type AxisScores = {
  harm: number;
  exaggeration: number;
  n1hype: number;
  originality: number;
  solution_hiding: number;
  social_proof_fake: number;
  ai_slop: number;
  clickbait: number;
};

export type DisplayScores = {
  煽り誇大: number;
  実績の怪しさ: number;
  情報の薄さ: number;
  囲い込み: number;
  有害度: number;
};

export function calcTotal(scores: AxisScores): number {
  return Math.round(
    scores.harm              * 0.22 +
    scores.exaggeration      * 0.18 +
    scores.n1hype            * 0.15 +
    scores.originality       * 0.13 +
    scores.solution_hiding   * 0.13 +
    scores.social_proof_fake * 0.08 +
    scores.ai_slop           * 0.06 +
    scores.clickbait         * 0.05
  );
}

export function calcDisplayScores(s: AxisScores): DisplayScores {
  return {
    煽り誇大:    Math.round(s.exaggeration * 0.7 + s.clickbait * 0.3),
    実績の怪しさ: Math.round(s.n1hype * 0.6 + s.social_proof_fake * 0.4),
    情報の薄さ:  Math.round(s.originality * 0.6 + s.ai_slop * 0.4),
    囲い込み:   s.solution_hiding,
    有害度:     s.harm,
  };
}
