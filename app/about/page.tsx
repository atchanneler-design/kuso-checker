import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About / 運営情報・利用規約',
  description: 'クソ記事チェッカーの運営情報、利用規約、プライバシーポリシー、免責事項について。',
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-gray-300 py-16 px-4">
      <div className="max-w-3xl mx-auto space-y-16">
        
        {/* Header */}
        <section className="text-center space-y-4">
          <h1 className="text-3xl font-black text-white tracking-tighter italic">ABOUT</h1>
          <p className="text-sm text-gray-500 uppercase tracking-widest font-bold">運営情報・利用規約・プライバシーポリシー</p>
        </section>

        {/* 1. Site Overview */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-white border-l-4 border-red-600 pl-4 flex items-center gap-2">
            コンセプト
          </h2>
          <div className="space-y-4 text-sm leading-relaxed">
            <p>
              「クソ記事チェッカー」は、インターネット上に急増する「中身の薄いAI量産記事」や「誇大広告の強い商材（note、Brain、Tips、Kindle等）」の構成パターンをAIが客観的に分析し、その傾向（クソ度）を可視化するサービスです。
            </p>
            <p>
              価値のない情報に時間とお金を浪費する被害を一人でも多く減らすこと、そして良質な情報が正当に評価されるインターネット環境を目指して運営されています。
            </p>
          </div>
        </section>

        {/* 2. Mechanism & Privacy */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-white border-l-4 border-red-600 pl-4 flex items-center gap-2">
            AI判定とプライバシーへの配慮
          </h2>
          <div className="space-y-4 text-sm leading-relaxed p-6 bg-gray-900/50 rounded-xl border border-gray-800">
            <h3 className="font-bold text-red-500 underline underline-offset-4">ゼロ知識設計の徹底</h3>
            <p>
              当サービスは、ユーザーのプライバシーを最優先に設計されています。判定用に入力された「記事の本文」や「URLから抽出されたテキスト」は、AIによる一時的な解析にのみ使用され、**当サーバーのデータベースやログには一切保存されません。**
            </p>
            <p>
              保存されるデータは、AIが生成した「判定結果（スコア・解説文）」および「データの整合性を確認するための指紋（ハッシュ値）」のみであり、元の文章（入力内容）を復元することは不可能な仕組みになっています。
            </p>
          </div>
        </section>

        {/* 3. Terms of Use */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-white border-l-4 border-red-600 pl-4 flex items-center gap-2">
            利用規約
          </h2>
          <div className="space-y-4 text-sm leading-relaxed">
            <p>当サービスの利用にあたり、以下の行為を禁止します。</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>ボットやスクレイピング等による、過度な自動アクセスの試行</li>
              <li>サーバーに著しい負荷をかける行為</li>
              <li>当サービスの判定結果を悪用し、特定の個人や団体を不当に誹謗中傷する行為</li>
              <li>その他、運営が不適切と判断した行為</li>
            </ul>
            <p>
              禁止行為が確認された場合、予告なくIPアドレスの制限等の措置を講じることがあります。
            </p>
          </div>
        </section>

        {/* 4. Disclaimer */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-white border-l-4 border-red-600 pl-4 flex items-center gap-2">
            免責事項
          </h2>
          <div className="space-y-4 text-sm leading-relaxed">
            <p>
              当サービスが提供する「クソ度」および分析結果は、最新のAI（Claude等）による特定アルゴリズムに基づいた**統計的・主観的な分析**であり、特定の商材の真贋、詐欺性、または価値の有無を法的に断定するものではありません。
            </p>
            <p>
              判定結果のみを根拠とした重要な意思決定（購入、契約、法的措置等）は行わないでください。最終的な判断は必ずご自身の責任において行ってください。当サービスを利用したことにより生じたいかなる損失・損害についても、運営者は一切の責任を負いかねます。
            </p>
            <p>
               また、他者の著作物を入力する際は著作権等の権利に十分ご注意ください。個人情報を含むテキストの入力はお控えください。
            </p>
            <p>
               本サービスで生成された文章や画像の著作権は、各AIサービスのアグリーメントおよび当サービスに帰属しますが、SNSでのシェアや個人的な保存は自由に行っていただいて構いません。
            </p>
          </div>
        </section>

        {/* 5. Privacy Policy */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-white border-l-4 border-red-600 pl-4 flex items-center gap-2">
            プライバシーポリシー
          </h2>
          <div className="space-y-4 text-sm leading-relaxed">
            <p>
              当サービスでは、利用状況の分析およびサービス向上のため、Vercel Web Analytics および Google Search Console を使用しています。これらのツールは「Cookie」を使用してトラフィックデータを収集しますが、データは匿名で収集されており、個人を特定するものではありません。
            </p>
          </div>
        </section>

        {/* 6. Contact & Operator */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-white border-l-4 border-red-600 pl-4 flex items-center gap-2">
            運営者・お問い合わせ
          </h2>
          <div className="space-y-6 text-sm leading-relaxed">
            <div>
              <p className="font-bold text-white mb-2 underline whitespace-pre">運 営 者 ：</p>
              <p>クソ記事チェッカー開発チーム（個人開発）</p>
            </div>
            <div>
              <p className="font-bold text-white mb-2 underline whitespace-pre">お問合せ ：</p>
              <p>
                不具合の報告、権利侵害による掲載取り下げの依頼、その他お問い合わせは下記よりお願いいたします。
              </p>
              <div className="mt-4 flex flex-wrap gap-4">
                <Link 
                  href="https://x.com/ai_article_jp" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white text-black font-bold px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.858L1.255 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  公式X (@ai_article_jp)
                </Link>
                {/* 
                <a href="mailto:your-email@gmail.com" className="inline-flex items-center gap-2 bg-gray-800 text-white font-bold px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors border border-gray-700">
                  ✉️ メールでお問い合わせ
                </a>
                */}
              </div>
            </div>
          </div>
        </section>

        {/* Footer in page */}
        <div className="pt-16 pb-8 text-center">
          <Link href="/" className="text-xs text-red-500 font-bold hover:underline underline-offset-4">
            ← 判定フォームへ戻る
          </Link>
        </div>

      </div>
    </main>
  );
}
