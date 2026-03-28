import Link from 'next/link';

export default function DisclaimerPage() {
  return (
    <main className="min-h-screen">
      <div className="bg-gradient-to-br from-red-600 to-red-800 text-white py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-black">免責事項</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="font-bold text-gray-900 mb-2">本サービスについて</h2>
            <p>
              クソ記事チェッカーは、AIを活用して記事・コンテンツの特徴を分析するツールです。
              判定結果はAIによる自動分析であり、運営者個人の意見・評価・断定を表すものではありません。
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">判定結果の性質</h2>
            <p>
              本サービスの判定結果は参考情報として提供されるものであり、特定の記事・サービス・個人・企業を
              誹謗中傷・名誉毀損する意図はありません。スコアおよびコメントは統計的・確率的な分析に基づくものであり、
              その正確性・完全性を保証するものではありません。
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">利用上の注意</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>判定結果のみを根拠とした重要な意思決定は行わないでください。</li>
              <li>他者の著作物を入力する際は、著作権等の権利に十分ご注意ください。</li>
              <li>個人情報を含むテキストの入力はお控えください。</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">損害賠償の免責</h2>
            <p>
              本サービスの利用または利用不能により生じた損害について、運営者は一切の責任を負いません。
              サービスは予告なく変更・停止される場合があります。
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">レートリミット</h2>
            <p>
              本サービスは1IPアドレスあたり1日3回までご利用いただけます。
              超過した場合は翌日（JST 0時）以降に再度ご利用ください。
            </p>
          </section>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-red-600 hover:underline">
            ← トップページに戻る
          </Link>
        </div>
      </div>
    </main>
  );
}
