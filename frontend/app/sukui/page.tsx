import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const PAGE_TITLE = 'ホタルイカ掬いとは？｜初心者向け完全ガイド';
const PAGE_DESCRIPTION =
  '富山湾の春の風物詩「ホタルイカ掬い」を初心者向けに解説。シーズン、接岸しやすい条件、必要な道具、護岸・立ち込みの掬い方、持ち帰り後の処理、安全対策まで、現地での楽しみ方をまとめました。';
const PAGE_PATH = '/sukui';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: PAGE_PATH,
  },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: `${baseUrl}${PAGE_PATH}`,
    type: 'article',
    locale: 'ja_JP',
  },
  twitter: {
    card: 'summary_large_image',
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
};

const SukuiPage = () => {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'ホタルイカ掬いとは？初心者向け完全ガイド',
    description: PAGE_DESCRIPTION,
    inLanguage: 'ja',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}${PAGE_PATH}`,
    },
    about: {
      '@type': 'Thing',
      name: 'ホタルイカ掬い',
    },
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mb-3 md:mb-6 md:ml-auto md:-mr-6">
        <Link href="/" passHref>
          <Button variant="ghost" className="h-8 sm:h-9 px-2 text-white hover:bg-white/10 rounded-sm sm:rounded-lg">
            <ArrowLeft className="w-4 h-4 mr-1" />
            戻る
          </Button>
        </Link>
      </div>
      <Card className="max-w-4xl mx-auto bg-card/80 backdrop-blur-sm border-blue-400/20">
        <CardHeader>
          <h1 className="text-2xl md:text-3xl font-bold text-center bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent py-2 leading-tight tracking-tight">
            ホタルイカ掬いとは？
          </h1>
        </CardHeader>
        <CardContent className="space-y-8 text-base md:text-lg leading-relaxed text-foreground/90">
          <section>
            <p>
              ホタルイカ掬いとは、春の富山湾で産卵のため岸近くまで押し寄せたホタルイカを、タモ網で掬い上げる体験のことです。普段は水深200〜600mの深海に暮らす生き物を、岸辺から手の届く距離で観察・採取できるのは世界的にも珍しく、富山湾ならではの春の風物詩として親しまれています。
            </p>
            <p className="mt-4">
              青白く発光しながら波打ち際に押し寄せる光景は幻想的で、毎年シーズンになると県内外から多くの人が訪れます。なぜホタルイカが岸まで来るのかという「身投げ」の仕組みについては、
              <Link href="/about" className="text-blue-400 hover:underline">
                このサイトについて
              </Link>
              のページでも詳しく紹介しています。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 border-b-2 border-blue-300/20 pb-2 text-blue-300 text-glow-weak">
              シーズンと時間帯
            </h2>
            <p>
              ホタルイカ掬いのシーズンは <span className="font-semibold text-blue-200/90">3月〜5月</span>、特に4月〜5月のゴールデンウィーク前後がピークです。地域や年によっては2月下旬から始まり、6月頭まで続くこともあります。
            </p>
            <p className="mt-4">
              時間帯は <span className="font-semibold text-blue-200/90">深夜から明け方</span> がメインで、目安としては21時頃から日の出までの間。年や日によって異なりますが、0時前後から3時頃が湧きやすい傾向と言われています。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 border-b-2 border-blue-300/20 pb-2 text-blue-300 text-glow-weak">
              接岸しやすい条件
            </h2>
            <p>
              ホタルイカが岸近くまで寄ってくる条件は完全には解明されていませんが、経験的に次のような条件が揃った夜に湧きやすいと言われています。
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 bg-muted/50 p-6 rounded-lg border border-blue-400/10">
              <li><span className="font-semibold text-purple-300">月齢：</span>新月の前後数日、月明かりの少ない暗い夜</li>
              <li><span className="font-semibold text-purple-300">潮：</span>満潮の前後（特に満潮から1〜2時間前後）</li>
              <li><span className="font-semibold text-purple-300">風：</span>南風で波が穏やかな夜（北風が強い夜は期待薄）</li>
              <li><span className="font-semibold text-purple-300">天候：</span>晴れて気温が下がりすぎていない夜。前日に大雨で海が濁っていないこと</li>
              <li><span className="font-semibold text-purple-300">波高：</span>1m未満が目安。波が高いと安全面でも掬い的にも厳しい</li>
            </ul>
            <p className="mt-4 text-sm text-foreground/70">
              当サイトでは、こうした条件をAIが学習し、日ごとの期待度を「湧き指数」として算出しています。出かける前の参考にご活用ください。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 border-b-2 border-blue-300/20 pb-2 text-blue-300 text-glow-weak">
              どこで掬うのか
            </h2>
            <p>
              富山湾は急深の地形により、深海から岸までの距離がとても近いことから「天然のいけす」とも呼ばれ、ホタルイカ接岸の聖地とされています。富山県内では、滑川市から黒部市にかけて「ホタルイカ漁場」として指定されたエリアもありますが、掬い自体は富山湾沿岸の各地で楽しまれています。
            </p>
            <p className="mt-4">
              具体的なポイントの混雑状況や直近の湧き情報は、
              <Link href="/" className="text-blue-400 hover:underline">
                トップページの掲示板
              </Link>
              で現地からの最新情報を確認できます。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 border-b-2 border-blue-300/20 pb-2 text-blue-300 text-glow-weak">
              掬い方の2つのスタイル
            </h2>
            <p>
              ホタルイカ掬いには大きく分けて2つのスタイルがあります。自分の装備や経験、当日の海の状況に合わせて選びましょう。
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-base">
              <div className="bg-muted/40 p-5 rounded-lg border border-blue-400/10">
                <h3 className="font-semibold text-purple-300 mb-2">①護岸スタイル</h3>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  防波堤や護岸の上からライトで海面を照らし、長めのタモ網で掬う方法です。足元が安定しており濡れない一方、海に落ちると非常に危険なため、柵を越えないなどの注意が必要です。柄の長い網（5m前後）が向いています。
                </p>
              </div>
              <div className="bg-muted/40 p-5 rounded-lg border border-blue-400/10">
                <h3 className="font-semibold text-purple-300 mb-2">②立ち込みスタイル</h3>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  ウェーダー（胴付き長靴）を着用して波打ち際に入り、すぐ目の前のホタルイカを掬う方法です。より近い距離で楽しめますが、波・うねり・離岸流など海のリスクが常にあります。ライフジャケットの着用が必須です。
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 border-b-2 border-blue-300/20 pb-2 text-blue-300 text-glow-weak">
              必要な道具・装備
            </h2>
            <ul className="list-disc list-inside space-y-3">
              <li>
                <span className="font-semibold text-blue-200/90">タモ網：</span>
                護岸からなら柄の長いもの（5m前後）、立ち込みなら2m前後が目安。網目1cm程度・直径25〜35cm・深めのものが扱いやすいです。
              </li>
              <li>
                <span className="font-semibold text-blue-200/90">ヘッドライト・強力ライト：</span>
                両手を使うのでヘッドライト必須。海面を照らす集魚用には、できるだけ明るい拡散型のライトがあると便利です。予備の電池も忘れずに。
              </li>
              <li>
                <span className="font-semibold text-blue-200/90">長靴 or ウェーダー：</span>
                波打ち際は濡れるため最低でも長靴は必須。立ち込みスタイルならチェストハイのウェーダーを。
              </li>
              <li>
                <span className="font-semibold text-blue-200/90">ライフジャケット（立ち込み時は必須）：</span>
                立ち込み時は<span className="font-semibold text-blue-200/90">固形式</span>を選びましょう。膨張式は波の衝撃で誤作動する危険があります。
              </li>
              <li>
                <span className="font-semibold text-blue-200/90">クーラーボックス・バケツ：</span>
                持ち帰り用。中に海水と氷を入れる「海水氷」での保管が鮮度を保つコツです。
              </li>
              <li>
                <span className="font-semibold text-blue-200/90">防寒着・手袋・タオル：</span>
                富山の春の海岸は深夜冷え込みます。風を通しにくい防寒着、濡れに強い手袋を用意しましょう。
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 border-b-2 border-blue-300/20 pb-2 text-blue-300 text-glow-weak">
              掬い方のコツ
            </h2>
            <ul className="list-disc list-inside space-y-3">
              <li>
                <span className="font-semibold text-blue-200/90">ライトは少し先を照らす：</span>
                足元ではなく、2〜3m先の海面〜海中を照らすイメージで。光に集まる習性を利用します。
              </li>
              <li>
                <span className="font-semibold text-blue-200/90">光と影の境目を狙う：</span>
                ホタルイカは光の境目に集まりやすいと言われています。
              </li>
              <li>
                <span className="font-semibold text-blue-200/90">網は「押す」のではなく「すくい上げる」：</span>
                横から滑り込ませて、下からすくい上げるのが基本動作です。
              </li>
              <li>
                <span className="font-semibold text-blue-200/90">波のリズムに合わせる：</span>
                立ち込みの場合、寄せ波・引き波のタイミングに合わせて動くと安全かつ効率的です。
              </li>
              <li>
                <span className="font-semibold text-blue-200/90">ライトを照らしすぎない：</span>
                周囲に人が多いとライトが多すぎて逆効果になることも。状況に応じて消す勇気も大切です。
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 border-b-2 border-blue-300/20 pb-2 text-blue-300 text-glow-weak">
              持ち帰りと食べ方
            </h2>
            <p>
              掬ったホタルイカは、<span className="font-semibold text-blue-200/90">海水＋氷</span> を入れたクーラーボックスで持ち帰るのが基本です。直接氷に触れさせたり、解けた真水に浸かったりすると身が傷みやすいので注意しましょう。
            </p>
            <p className="mt-4">
              <span className="font-semibold text-pink-300">非常に重要：</span> ホタルイカには寄生虫（旋尾線虫・アニサキス）のリスクがあるため、<span className="font-semibold text-pink-300">生食は厳禁</span>です。必ず加熱（ボイル）するか、規定の温度・期間で適切に冷凍処理を行ってから食べてください。詳しくは
              <Link href="/manners" className="text-blue-400 hover:underline">
                マナーページの「寄生虫の警告」
              </Link>
              もご確認ください。
            </p>
            <p className="mt-4">
              代表的な調理方法は、塩茹で（さっと湯がいて酢味噌で食べる「ボイル」）、沖漬け、しゃぶしゃぶ（必ず加熱）、パスタやアヒージョなどさまざまです。新鮮なうちに下処理（目玉やくちばし、軟骨を取る）をしておくと食べやすくなります。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 border-b-2 border-blue-300/20 pb-2 text-blue-300 text-glow-weak">
              安全とマナー
            </h2>
            <p>
              ホタルイカ掬いは深夜の海辺での活動です。波・うねり・寒さ・落水など、楽しい体験の裏には常にリスクがあります。単独行動は避け、その日の波・天候を必ず事前に確認し、無理をしないことが大切です。
            </p>
            <p className="mt-4">
              また、漁港や海岸は地元の方の生活の場でもあります。深夜の騒音や違法駐車、ゴミの放置などは厳禁です。ホタルイカ掬いの文化を未来へつなぐためにも、
              <Link href="/manners" className="text-blue-400 hover:underline">
                ホタルイカ掬いのマナー
              </Link>
              を必ずご一読のうえ、現地にお出かけください。
            </p>
          </section>

          <div className="bg-muted/50 p-6 rounded-lg border border-blue-400/10 text-center">
            <p className="text-sm text-foreground/80">
              当サイトでは、ホタルイカが湧きやすい条件をAIで分析した「湧き指数」を毎日提供しています。
            </p>
            <p className="text-sm text-foreground/80 mt-2">
              <Link href="/" className="text-blue-400 hover:underline">
                トップページで今日・明日の湧き指数を確認する →
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SukuiPage;
