import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const PAGE_TITLE = 'ホタルイカ掬いとは？｜初心者向け完全ガイド';
const PAGE_DESCRIPTION =
  '富山湾の春の風物詩「ホタルイカ掬い」を初心者向けに徹底解説。ホタルイカの生態と発光のしくみ、シーズン・時間帯、月別の傾向、主要スポットの特徴比較、必要な道具、護岸・立ち込みの掬い方、持ち帰り後の処理から食べ方まで、現地での楽しみ方をすべてまとめました。';
const PAGE_PATH = '/hotaruika-sukui-guide';

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

const SECTIONS = [
  { id: 'biology', label: 'ホタルイカという生き物' },
  { id: 'season', label: 'シーズンと時間帯' },
  { id: 'monthly-trend', label: '月別・時間帯別の傾向' },
  { id: 'conditions', label: '接岸しやすい条件' },
  { id: 'spots', label: '主要スポットの特徴比較' },
  { id: 'styles', label: '掬い方の2つのスタイル' },
  { id: 'equipment', label: '必要な道具・装備' },
  { id: 'tips', label: '掬い方のコツ' },
  { id: 'preparation', label: '持ち帰りと食べ方' },
  { id: 'safety', label: '安全とマナー' },
];

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
        <CardContent className="space-y-10 text-base md:text-lg leading-relaxed text-foreground/90">
          <section>
            <p>
              ホタルイカ掬いとは、春の富山湾で産卵のため岸近くまで押し寄せたホタルイカを、タモ網で掬い上げる体験のことです。普段は水深200〜600mの深海に暮らす生き物を、岸辺から手の届く距離で観察・採取できるのは世界的にも珍しく、富山湾ならではの春の風物詩として親しまれています。
            </p>
            <p className="mt-4">
              青白く発光しながら波打ち際に押し寄せる光景は幻想的で、毎年シーズンになると県内外から多くの人が訪れます。
            </p>
          </section>

          <nav aria-label="目次" className="bg-muted/50 p-5 rounded-lg border border-blue-400/10">
            <h2 className="text-lg font-semibold text-blue-300 mb-3">目次</h2>
            <ol className="list-decimal list-inside space-y-1.5 text-sm md:text-base text-foreground/80">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-blue-400 hover:underline">
                    {s.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <section id="biology" className="scroll-mt-20">
            <h2 className="text-xl font-semibold mb-4 border-b-2 border-blue-300/20 pb-2 text-blue-300 text-glow-weak">
              ホタルイカという生き物
            </h2>

            <h3 className="text-lg font-semibold text-purple-300 mt-4 mb-2">基本データ</h3>
            <ul className="list-disc list-inside space-y-2 bg-muted/40 p-5 rounded-lg border border-blue-400/10 text-base">
              <li><span className="font-semibold text-blue-200/90">学名：</span>Watasenia scintillans（ワタセニア・シンチランス）</li>
              <li><span className="font-semibold text-blue-200/90">分類：</span>ホタルイカモドキ科 ホタルイカ属</li>
              <li><span className="font-semibold text-blue-200/90">大きさ：</span>胴長 雄 約4cm、雌 約6cm、重さ 約10g</li>
              <li><span className="font-semibold text-blue-200/90">生息域：</span>日本海・オホーツク海・太平洋沿岸の深海。日中は水深200〜600mに、夜は表層付近まで上昇</li>
              <li><span className="font-semibold text-blue-200/90">寿命：</span>約1年（孵化から産卵・死までほぼ1年で一生を終える）</li>
              <li><span className="font-semibold text-blue-200/90">富山県の魚：</span>1996年に指定。富山湾の象徴的存在</li>
            </ul>

            <h3 className="text-lg font-semibold text-purple-300 mt-6 mb-2">3種類の発光器</h3>
            <p>
              ホタルイカが青白く光るのは、体に備わった発光器（はっこうき）の働きです。発光器は腹側を中心に3種類存在し、それぞれ役割が異なるとされています。
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
              <div className="bg-muted/40 p-4 rounded-lg border border-blue-400/10">
                <h4 className="font-semibold text-blue-200/90 mb-1">腕先発光器</h4>
                <p className="text-sm text-foreground/80">8本の腕のうち4本の先端に各3個ずつ配置。最も強く青白く光るのがこの部分で、人間が目にする「ホタルイカの発光」のほとんどはここ。</p>
              </div>
              <div className="bg-muted/40 p-4 rounded-lg border border-blue-400/10">
                <h4 className="font-semibold text-blue-200/90 mb-1">皮膚発光器</h4>
                <p className="text-sm text-foreground/80">体表面に700〜1000個の細かい発光器が散らばっており、青緑色にぼんやり光る。深海でのカウンターイルミネーション（後述）に関わると考えられている。</p>
              </div>
              <div className="bg-muted/40 p-4 rounded-lg border border-blue-400/10">
                <h4 className="font-semibold text-blue-200/90 mb-1">眼発光器</h4>
                <p className="text-sm text-foreground/80">左右の眼の周囲にそれぞれ5個ずつ配置。役割ははっきり分かっていないが、コミュニケーション説や視野補助説などがある。</p>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-purple-300 mt-6 mb-2">発光の役割</h3>
            <ul className="list-disc list-inside space-y-2">
              <li><span className="font-semibold text-blue-200/90">カウンターイルミネーション：</span>深海では水面から差し込む薄い光に対し、自分の腹を発光させることで影を消し、下から見上げる捕食者から身を守る隠蔽効果があると考えられています。</li>
              <li><span className="font-semibold text-blue-200/90">仲間との合図：</span>群れの統率や交尾相手へのアピールに使われている可能性。</li>
              <li><span className="font-semibold text-blue-200/90">威嚇・誘引：</span>急に強く光ることで天敵を驚かす、または小魚を引き寄せて捕食する、といった働きが指摘されています。</li>
            </ul>

            <h3 className="text-lg font-semibold text-purple-300 mt-6 mb-2">1年の一生</h3>
            <p>
              ホタルイカの寿命はほぼ1年。前年の春に生まれた個体が翌年の春に成熟し、交尾・産卵を経て一生を終えます。雌は産卵期の3〜5月に1回あたり数千〜1万個の卵を産み、卵は富山湾の水温で2週間ほどで孵化します。岸まで来るのはほとんどが「これから産卵する雌」で、産卵を終えた個体は体力を使い果たして波打ち際に打ち上げられることが、いわゆる「身投げ」の正体です。
            </p>

            <h3 className="text-lg font-semibold text-purple-300 mt-6 mb-2">なぜ富山湾なのか</h3>
            <p>
              ホタルイカ自体は日本海一帯に分布していますが、これだけ大量に岸まで押し寄せる現象が見られるのは富山湾だけと言われ、世界的にも極めて珍しい現象です。理由として有力なのは、富山湾の <span className="font-semibold text-blue-200/90">「すり鉢状の急深な地形」</span> です。湾内では深海と岸が非常に近く、深海から上向きに発生する湧昇流（ゆうしょうりゅう）が、産卵のため浮上したホタルイカを岸際まで運んでいると考えられています。
            </p>
            <p className="mt-4">
              なお、富山県滑川市の沖合「ホタルイカ群遊海面」は <span className="font-semibold text-blue-200/90">国の特別天然記念物</span> に指定されており、自然保護の対象でもあります。
            </p>
          </section>

          <section id="season" className="scroll-mt-20">
            <h2 className="text-xl font-semibold mb-4 border-b-2 border-blue-300/20 pb-2 text-blue-300 text-glow-weak">
              シーズンと時間帯
            </h2>
            <p>
              ホタルイカ掬いのシーズンは、産卵のため接岸する <span className="font-semibold text-blue-200/90">3月〜5月</span> がメインです。地域や年により早ければ2月下旬から始まり、遅いと6月初旬まで続くこともあります。
            </p>
            <p className="mt-4">
              時間帯は、ホタルイカが岸近くに姿を現す <span className="font-semibold text-blue-200/90">深夜から明け方</span> がほとんどです。日没後すぐは少なく、おおむね21時頃から増え始め、0時〜3時頃にピークを迎え、日の出までには沖へ帰っていくというパターンが多いです。
            </p>
            <p className="mt-4 text-sm text-foreground/70">
              夕方や早朝に岸辺で観光的に光景を見たいだけなら、滑川の観光遊覧船などを利用するのも一つの選択肢です。
            </p>
          </section>

          <section id="monthly-trend" className="scroll-mt-20">
            <h2 className="text-xl font-semibold mb-4 border-b-2 border-blue-300/20 pb-2 text-blue-300 text-glow-weak">
              月別・時間帯別の傾向
            </h2>
            <p>
              年により当たり外れはありますが、過去の傾向から、月別・時間帯別の「湧きやすさ」のおおまかな目安を整理すると以下のようになります。
            </p>

            <h3 className="text-lg font-semibold text-purple-300 mt-6 mb-2">月別の傾向</h3>
            <div className="space-y-3">
              <div className="bg-muted/40 p-4 rounded-lg border border-blue-400/10">
                <h4 className="font-semibold text-blue-200/90 mb-1">2月下旬〜3月上旬：シーズン入り</h4>
                <p className="text-sm text-foreground/80">水温がまだ低く、接岸は少なめ。湧いても規模が小さく、空振りも多い時期。本格的なシーズンインを待つ準備期間。</p>
              </div>
              <div className="bg-muted/40 p-4 rounded-lg border border-blue-400/10">
                <h4 className="font-semibold text-blue-200/90 mb-1">3月中旬〜下旬：上昇期</h4>
                <p className="text-sm text-foreground/80">湧きやすさが急に高まる時期。新月前後に「爆湧き」の報告が出始める。混雑も増えてくる。</p>
              </div>
              <div className="bg-muted/40 p-4 rounded-lg border border-blue-400/10">
                <h4 className="font-semibold text-blue-200/90 mb-1">4月：ピーク</h4>
                <p className="text-sm text-foreground/80">最も湧きやすい時期。気温も上がり、活動しやすい。条件が揃えば数百匹単位で掬える夜も。一番の混雑期でもあるためマナー徹底が重要。</p>
              </div>
              <div className="bg-muted/40 p-4 rounded-lg border border-blue-400/10">
                <h4 className="font-semibold text-blue-200/90 mb-1">5月：後半戦</h4>
                <p className="text-sm text-foreground/80">産卵後の弱った個体が増え、規模は徐々に縮小。ただし条件が良ければまだ十分湧く。GW以降は人出も落ち着く傾向。</p>
              </div>
              <div className="bg-muted/40 p-4 rounded-lg border border-blue-400/10">
                <h4 className="font-semibold text-blue-200/90 mb-1">6月：終了期</h4>
                <p className="text-sm text-foreground/80">ほぼシーズン終了。稀に湧く程度。来年に向けて道具のメンテナンスを。</p>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-purple-300 mt-6 mb-2">時間帯別の傾向</h3>
            <ul className="list-disc list-inside space-y-2">
              <li><span className="font-semibold text-blue-200/90">21時〜23時：</span>湧き始め。ポツポツと数匹が打ち寄せ始める段階。確認＆場所取りの時間帯。</li>
              <li><span className="font-semibold text-blue-200/90">23時〜1時：</span>本格化。波打ち際に光の塊が見えるようになり、立ち込みでも護岸でも掬えるようになる。</li>
              <li><span className="font-semibold text-blue-200/90">1時〜3時：</span>ピーク。最も湧きやすい時間帯。条件が良い夜はここで一気に数を稼げる。</li>
              <li><span className="font-semibold text-blue-200/90">3時〜5時：</span>沖へ帰り始める。波打ち際の光は徐々に減り、明け方には終わる。</li>
            </ul>
            <p className="mt-4 text-sm text-foreground/70">
              ※あくまで一般的な傾向です。当日の風・潮・月齢で大きく前後しますので、現地の掲示板情報や当サイトの湧き指数を必ず確認してください。
            </p>
          </section>

          <section id="conditions" className="scroll-mt-20">
            <h2 className="text-xl font-semibold mb-4 border-b-2 border-blue-300/20 pb-2 text-blue-300 text-glow-weak">
              接岸しやすい条件
            </h2>
            <p>
              ホタルイカが岸近くまで寄ってくる条件は完全には解明されていませんが、長年の経験から次の条件が揃った夜に湧きやすいと言われています。
            </p>
            <ul className="list-disc list-inside mt-4 space-y-3 bg-muted/50 p-6 rounded-lg border border-blue-400/10">
              <li><span className="font-semibold text-purple-300">月齢：</span>新月の前後数日、月明かりの少ない暗い夜。明るい満月の夜は警戒して浮上しないとされる。</li>
              <li><span className="font-semibold text-purple-300">潮：</span>満潮の前後（特に満潮から1〜2時間前後）。潮位が高いほうが岸まで届きやすい。</li>
              <li><span className="font-semibold text-purple-300">風：</span>とにかく <span className="font-semibold text-blue-200/90">風が弱い夜</span> が最重要。風向きは南寄りが好まれるが、強風だと風向きに関係なく波立って湧きにくい。</li>
              <li><span className="font-semibold text-purple-300">天候：</span>晴れて気温が下がりすぎていない夜。前日に大雨で海が濁っている夜は湧きにくい。</li>
              <li><span className="font-semibold text-purple-300">波高：</span>1m未満が目安。波が高いと安全面でも掬い的にも厳しい。</li>
              <li><span className="font-semibold text-purple-300">気温：</span>暖かい日のほうが湧きやすい。</li>
            </ul>
            <p className="mt-4 text-sm text-foreground/70">
              当サイトでは、これらの条件をAIが学習し、日ごとの期待度を「湧き指数」として算出しています。出かける前の参考にご活用ください。
            </p>
          </section>

          <section id="spots" className="scroll-mt-20">
            <h2 className="text-xl font-semibold mb-4 border-b-2 border-blue-300/20 pb-2 text-blue-300 text-glow-weak">
              主要スポットの特徴比較
            </h2>
            <p>
              富山湾沿岸はどこでもホタルイカが寄る可能性がありますが、よく名前が挙がるエリアの基本情報を整理しておきます。なお、富山湾の主な水揚げ漁港は <span className="font-semibold text-blue-200/90">新湊・四方・岩瀬・水橋・滑川・魚津</span> の各漁港ですが、漁港内は漁業関係者の作業場のため、掬いは原則として隣接する砂浜で行うのが基本です。
            </p>

            <p className="mt-3 text-sm text-foreground/70">
              ※以下、富山湾を <span className="font-semibold text-blue-200/90">西から東</span> の順に並べています。
            </p>

            <div className="space-y-4 mt-4">
              <div className="bg-muted/40 p-5 rounded-lg border border-blue-400/10">
                <h3 className="font-semibold text-blue-200/90 mb-2">海老江海浜公園／射水市</h3>
                <p className="text-sm text-foreground/80 leading-relaxed mb-3">
                  富山市の西隣、射水市にある海浜公園。本江海岸まで続く長い海岸線を持ち、<span className="font-semibold text-blue-200/90">四方・岩瀬に比べて人が圧倒的に少ない穴場</span>として知られています。歩きながら探しやすく、湧きが薄い夜でも複数のポイントを試せます。
                </p>
                <ul className="text-sm text-foreground/80 space-y-1.5 list-none">
                  <li><span className="font-semibold text-blue-200/90">駐車場：</span>無料駐車場 約308台 ＋ 公衆トイレあり（県内のホタルイカスポット最大級のキャパ）</li>
                  <li><span className="font-semibold text-blue-200/90">足場：</span>砂浜中心、海岸線が長い</li>
                  <li><span className="font-semibold text-blue-200/90">混雑度：</span>中〜低（メインスポット比）</li>
                  <li><span className="font-semibold text-blue-200/90">向く人：</span>混雑を避けたい人、初心者、複数家族の同行、トイレ重視</li>
                  <li><span className="font-semibold text-blue-200/90">その他：</span>本江海岸方面まで海岸沿いに広く活動できる</li>
                </ul>
              </div>

              <div className="bg-muted/40 p-5 rounded-lg border border-blue-400/10">
                <h3 className="font-semibold text-blue-200/90 mb-2">四方漁港 周辺／富山市</h3>
                <p className="text-sm text-foreground/80 leading-relaxed mb-3">
                  富山市西部、八重津浜と隣接する漁港。<span className="font-semibold text-pink-300">漁港内でのホタルイカ採取は地元から自粛が呼びかけられている</span>ため、活動は隣接する砂浜・小堤防エリアに限られます。岩瀬浜・八重津浜と並んで人気が高く、深夜帯は非常に混雑します。
                </p>
                <ul className="text-sm text-foreground/80 space-y-1.5 list-none">
                  <li><span className="font-semibold text-blue-200/90">駐車場：</span>漁協建物前の駐車スペースは限定的。シーズン中は満車・路上駐車が問題化</li>
                  <li><span className="font-semibold text-blue-200/90">足場：</span>漁港内は不可、隣接砂浜＋小堤防のみ。遠浅ではない</li>
                  <li><span className="font-semibold text-blue-200/90">混雑度：</span>非常に高く、苦情も多発しているエリア</li>
                  <li><span className="font-semibold text-blue-200/90">向く人：</span>装備が充実した中級者以上</li>
                  <li><span className="font-semibold text-blue-200/90">注意：</span>「立入禁止」「駐車禁止」の看板を必ず確認。八重津浜と合わせて訪れるなら駐車は八重津浜側を推奨</li>
                </ul>
              </div>

              <div className="bg-muted/40 p-5 rounded-lg border border-blue-400/10">
                <h3 className="font-semibold text-blue-200/90 mb-2">八重津浜／富山市</h3>
                <p className="text-sm text-foreground/80 leading-relaxed mb-3">
                  富山市西部の海水浴場。遠浅で「腰より深くならない」と言われるほど浅瀬が広く、立ち込み初心者にも向く環境です。砂浜が広く、湧きの薄い夜に移動しながら探しやすいのも利点。
                </p>
                <ul className="text-sm text-foreground/80 space-y-1.5 list-none">
                  <li><span className="font-semibold text-blue-200/90">駐車場：</span>海水浴場側に無料駐車場あり</li>
                  <li><span className="font-semibold text-blue-200/90">アクセス：</span>隣接する四方漁港側からは通行止のため、必ず東側（海水浴場側）から進入</li>
                  <li><span className="font-semibold text-blue-200/90">足場：</span>砂浜・遠浅。立ち込みスタイル向き</li>
                  <li><span className="font-semibold text-blue-200/90">混雑度：</span>多いが砂浜の広さで分散される</li>
                  <li><span className="font-semibold text-blue-200/90">向く人：</span>装備が軽めの初心者、家族連れ</li>
                  <li><span className="font-semibold text-blue-200/90">その他：</span>四方漁港エリアと合わせて巡回する人も多い</li>
                </ul>
              </div>

                            <div className="bg-muted/40 p-5 rounded-lg border border-blue-400/10">
                <h3 className="font-semibold text-blue-200/90 mb-2">岩瀬浜／富山市</h3>
                <p className="text-sm text-foreground/80 leading-relaxed mb-3">
                  富山市岩瀬地区の海水浴場。海岸から10〜20mほど遠浅が続く広い砂浜で、立ち込みスタイル初心者にも向く環境。隣接する岩瀬漁港側では身投げ自体は確認されていません。シーズン中は深夜でもヘッドライトが浜中に広がるほど人が多く、人気の高さを物語ります。
                </p>
                <ul className="text-sm text-foreground/80 space-y-1.5 list-none">
                  <li><span className="font-semibold text-blue-200/90">駐車場：</span>海水浴場に東西2か所の無料駐車場（広め）。シーズン週末はほぼ満車</li>
                  <li><span className="font-semibold text-blue-200/90">アクセス：</span>北陸自動車道 富山ICから車で約35分</li>
                  <li><span className="font-semibold text-blue-200/90">足場：</span>砂浜のみ。長靴 or ウェーダー</li>
                  <li><span className="font-semibold text-blue-200/90">混雑度：</span>非常に高い（特に新月前後の週末）</li>
                  <li><span className="font-semibold text-blue-200/90">向く人：</span>初心者、立ち込み派</li>
                  <li><span className="font-semibold text-blue-200/90">その他：</span>フグが大量に泳いでいることもある</li>
                </ul>
              </div>

              <div className="bg-muted/40 p-5 rounded-lg border border-blue-400/10">
                <h3 className="font-semibold text-blue-200/90 mb-2">滑川エリア／滑川市</h3>
                <p className="text-sm text-foreground/80 leading-relaxed mb-3">
                  ホタルイカ漁の本場として古くから知られるエリア。1585年から漁獲記録があり、沖合の <span className="font-semibold text-blue-200/90">「ホタルイカ群遊海面」は1952年に国の特別天然記念物</span> に指定されています。観光資源としても整備されており、見学スタイルから本格的な掬いまで幅広く楽しめます。
                </p>
                <ul className="text-sm text-foreground/80 space-y-1.5 list-none">
                  <li><span className="font-semibold text-blue-200/90">観光：</span>道の駅「ウェーブパークなめりかわ」内にホタルイカミュージアム／3月下旬〜5月上旬は海上観光船（完全予約制）</li>
                  <li><span className="font-semibold text-blue-200/90">足場：</span>漁港は漁業者の作業場のため、岸からの掬いは隣接の浜辺で</li>
                  <li><span className="font-semibold text-blue-200/90">向く人：</span>観光と合わせて体験したい人、初めて富山を訪れる人</li>
                  <li><span className="font-semibold text-blue-200/90">注意：</span>漁業エリア・漁船周辺には絶対に立ち入らない</li>
                </ul>
              </div>

              <div className="bg-muted/40 p-5 rounded-lg border border-blue-400/10">
                <h3 className="font-semibold text-blue-200/90 mb-2">魚津漁港 周辺／魚津市</h3>
                <p className="text-sm text-foreground/80 leading-relaxed mb-3">
                  富山県東部、魚津市の漁港。魚津市ではホタルイカは蜃気楼・埋没林と並ぶ <span className="font-semibold text-blue-200/90">「魚津三大奇観」</span> の一つとして昔から大切にされています。漁港周辺の護岸が活動エリアの中心で、護岸スタイル向き。
                </p>
                <ul className="text-sm text-foreground/80 space-y-1.5 list-none">
                  <li><span className="font-semibold text-blue-200/90">周辺施設：</span>コンビニ・自販機が近く、長丁場でも装備の補充がしやすい</li>
                  <li><span className="font-semibold text-blue-200/90">足場：</span>護岸が中心。長い柄のタモが必要</li>
                  <li><span className="font-semibold text-blue-200/90">観光：</span>魚津水族館で3月下旬〜5月の日曜・祝日、ホタルイカの発光ショーあり</li>
                  <li><span className="font-semibold text-blue-200/90">向く人：</span>護岸スタイル派、観光と組み合わせたい人</li>
                  <li><span className="font-semibold text-blue-200/90">注意：</span>漁業関係者の作業エリアには立ち入らない</li>
                </ul>
              </div>

              <div className="bg-muted/40 p-5 rounded-lg border border-blue-400/10">
                <h3 className="font-semibold text-blue-200/90 mb-2">東部（入善町・朝日町・国分浜）</h3>
                <p className="text-sm text-foreground/80 leading-relaxed mb-3">
                  富山湾の東端、新潟寄りのエリア。中心部に比べて混雑が少なめで、地元では「穴場」として知られています。砂浜が中心のため立ち込みスタイル向き。湾の中心部で湧かない夜に、東西で状況が異なるため代替候補としても有効です。
                </p>
                <ul className="text-sm text-foreground/80 space-y-1.5 list-none">
                  <li><span className="font-semibold text-blue-200/90">足場：</span>砂浜中心、立ち込みスタイル向き</li>
                  <li><span className="font-semibold text-blue-200/90">混雑度：</span>低〜中</li>
                  <li><span className="font-semibold text-blue-200/90">向く人：</span>静かに楽しみたい人、混雑を避けたい人、湾全域を機動的に巡る人</li>
                  <li><span className="font-semibold text-blue-200/90">その他：</span>富山市中心部からは1時間前後、アクセスはやや遠めだがその分人が少ない</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 bg-muted/50 p-5 rounded-lg border border-pink-400/20">
              <h3 className="font-semibold text-pink-300 mb-2">⚠️ すべてのスポット共通の注意</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-foreground/80">
                <li>漁港内・漁船付近・テトラポッド上・防波堤の柵の外側は <span className="font-semibold">立ち入り禁止</span></li>
                <li>「侵入禁止」「立入禁止」「駐車禁止」の看板を必ず確認</li>
                <li>毎年マナー違反による苦情が出ており、規制強化につながりかねない状況</li>
              </ul>
            </div>
          </section>

          <section id="styles" className="scroll-mt-20">
            <h2 className="text-xl font-semibold mb-4 border-b-2 border-blue-300/20 pb-2 text-blue-300 text-glow-weak">
              掬い方の2つのスタイル
            </h2>
            <p>
              ホタルイカ掬いには大きく分けて2つのスタイルがあります。自分の装備や経験、当日の海の状況に合わせて選びましょう。
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-base">
              <div className="bg-muted/40 p-5 rounded-lg border border-blue-400/10">
                <h3 className="font-semibold text-purple-300 mb-2">①護岸スタイル</h3>
                <p className="text-sm text-foreground/80 leading-relaxed mb-3">
                  防波堤や護岸の上から、長めのタモ網で海面を掬う方法です。
                </p>
                <p className="text-sm text-foreground/80 leading-relaxed mb-2">
                  <span className="font-semibold text-blue-200/90">向いている人：</span>濡れずに掬いたい人、足腰に不安がある人、装備をシンプルにしたい人
                </p>
                <p className="text-sm text-foreground/80 leading-relaxed mb-2">
                  <span className="font-semibold text-blue-200/90">メリット：</span>足元が安定、濡れない、ウェーダー不要
                </p>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  <span className="font-semibold text-blue-200/90">デメリット：</span>柄の長いタモ網が必要（5m前後）、落水時のリスクが大きい、海面までの距離があるので感覚を掴むまで時間がかかる
                </p>
              </div>
              <div className="bg-muted/40 p-5 rounded-lg border border-blue-400/10">
                <h3 className="font-semibold text-purple-300 mb-2">②立ち込みスタイル</h3>
                <p className="text-sm text-foreground/80 leading-relaxed mb-3">
                  ウェーダー（胴付き長靴）を着用して波打ち際に入り、すぐ目の前のホタルイカを掬う方法です。
                </p>
                <p className="text-sm text-foreground/80 leading-relaxed mb-2">
                  <span className="font-semibold text-blue-200/90">向いている人：</span>本気で数を狙いたい人、間近で発光を観察したい人
                </p>
                <p className="text-sm text-foreground/80 leading-relaxed mb-2">
                  <span className="font-semibold text-blue-200/90">メリット：</span>短い網で済む、近距離で大量に掬える、間近で発光を観察できる
                </p>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  <span className="font-semibold text-blue-200/90">デメリット：</span>波・うねりに常に注意、ウェーダー＋固形ライフジャケットが必須、寒さがダイレクトに来る、装備が嵩張る
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-foreground/70">
              <span className="font-semibold text-pink-300">特に立ち込み時の注意：</span>ウェーダー内に水が入ると浮力が抜け、最悪パニックで溺れる事故が過去にも起きています。<span className="font-semibold">膨張式ではなく固形式の</span>ライフジャケットを必ず着用してください。
            </p>
          </section>

          <section id="equipment" className="scroll-mt-20">
            <h2 className="text-xl font-semibold mb-4 border-b-2 border-blue-300/20 pb-2 text-blue-300 text-glow-weak">
              必要な道具・装備
            </h2>
            <p>
              ホタルイカ掬いに必要な装備を、選び方のポイント付きで紹介します。
            </p>

            <h3 className="text-lg font-semibold text-purple-300 mt-6 mb-2">タモ網</h3>
            <ul className="list-disc list-inside space-y-1.5 text-base">
              <li><span className="font-semibold text-blue-200/90">柄の長さ：</span>護岸からなら5m前後、立ち込みなら2m前後が目安</li>
              <li><span className="font-semibold text-blue-200/90">網の直径：</span>25〜35cm程度。大きすぎると振りにくい</li>
              <li><span className="font-semibold text-blue-200/90">網目：</span>1cm前後。細かいほうがホタルイカが抜けにくい</li>
              <li><span className="font-semibold text-blue-200/90">深さ：</span>深めの形状のほうが、掬った後にこぼれにくい</li>
              <li><span className="font-semibold text-blue-200/90">素材：</span>ナイロン製が軽くて扱いやすい</li>
            </ul>

            <h3 className="text-lg font-semibold text-purple-300 mt-6 mb-2">ライト類</h3>
            <ul className="list-disc list-inside space-y-1.5 text-base">
              <li><span className="font-semibold text-blue-200/90">ヘッドライト：</span>両手を使うのでヘッドライトは必須。明るさは200ルーメン以上が目安</li>
              <li><span className="font-semibold text-blue-200/90">集魚用ライト：</span>海面を照らす拡散型の強力ライトがあると掬いやすさが段違い。水中型・水面型のLED集魚灯も人気</li>
              <li><span className="font-semibold text-blue-200/90">予備電池・モバイルバッテリー：</span>深夜の長時間使用なので必ず予備を持参</li>
            </ul>

            <h3 className="text-lg font-semibold text-purple-300 mt-6 mb-2">足元・防水装備</h3>
            <ul className="list-disc list-inside space-y-1.5 text-base">
              <li><span className="font-semibold text-blue-200/90">長靴：</span>護岸スタイル＋砂浜の波打ち際だけなら長靴で十分</li>
              <li><span className="font-semibold text-blue-200/90">ウェーダー：</span>立ち込みスタイルなら必須。チェストハイ（胸まで）のネオプレン製かナイロン製が定番</li>
              <li><span className="font-semibold text-blue-200/90">滑りにくい靴／ウェーディングシューズ：</span>濡れた護岸やテトラは非常に滑りやすい。フェルトスパイク等の滑り止め付きが安心</li>
            </ul>

            <h3 className="text-lg font-semibold text-purple-300 mt-6 mb-2">安全装備</h3>
            <ul className="list-disc list-inside space-y-1.5 text-base">
              <li><span className="font-semibold text-pink-300">ライフジャケット（立ち込み必須）：</span>必ず<span className="font-semibold">固形式</span>を選ぶ。膨張式は波の衝撃で誤作動・水中で正しく作動しないリスクあり</li>
              <li><span className="font-semibold text-blue-200/90">手袋：</span>防寒兼用。海水で塗れても保温性が落ちにくいネオプレン製が便利</li>
              <li><span className="font-semibold text-blue-200/90">タオル・ウェットティッシュ：</span>濡れた手や道具を拭く用</li>
            </ul>

            <h3 className="text-lg font-semibold text-purple-300 mt-6 mb-2">立ち込み時のかご</h3>
            <p className="text-sm text-foreground/80 leading-relaxed mb-3">
              立ち込みスタイルでは、<span className="font-semibold text-blue-200/90">浮き付きの買い物カゴを自作して使うのが定番</span>です。市販品はほとんど無く、ほぼ全員が自作しています。水面に浮かべ、紐で自分と繋いで一緒に移動します。
            </p>
            <p className="text-sm text-foreground/80 leading-relaxed mb-2">
              <span className="font-semibold text-blue-200/90">簡単な作り方：</span>
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-sm md:text-base text-foreground/80 ml-2">
              <li>スーパーの買い物カゴ（穴あきタイプ）を用意</li>
              <li>空のペットボトル（2L推奨）にキャップを締めて、結束バンドや紐でカゴの外側・側面に固定する（4本前後を均等に配置）</li>
              <li>カゴの取っ手部分に紐を結び、もう一端を自分の腰やウェーダーのベルトループに繋ぐ</li>
            </ol>
            <p className="text-sm text-foreground/70 mt-3">
              ポイントは <span className="font-semibold text-blue-200/90">浮力を十分に確保すること</span>（ホタルイカが入って重くなっても沈まないように）と、<span className="font-semibold text-blue-200/90">紐の長さを自分の動きやすさに合わせること</span>。
            </p>

            <h3 className="text-lg font-semibold text-purple-300 mt-6 mb-2">持ち帰り用</h3>
            <ul className="list-disc list-inside space-y-1.5 text-base">
              <li><span className="font-semibold text-blue-200/90">クーラーボックス：</span>20L前後が扱いやすい。海水＋氷で満たして持ち帰る（直接氷に触れさせない・真水NG）</li>
              <li><span className="font-semibold text-blue-200/90">板氷・保冷剤：</span>多めに用意。シーズン中はコンビニで買えることが多い</li>
              <li><span className="font-semibold text-blue-200/90">海水汲み用ペットボトル：</span>クーラーに足す海水を確保するのに便利</li>
            </ul>

            <h3 className="text-lg font-semibold text-purple-300 mt-6 mb-2">服装</h3>
            <ul className="list-disc list-inside space-y-1.5 text-base">
              <li><span className="font-semibold text-blue-200/90">防寒着：</span>3〜4月の深夜の海岸は真冬並みに冷え込む。風を通しにくいアウター必須</li>
              <li><span className="font-semibold text-blue-200/90">レインウェア：</span>急な天候変化や、しぶき対策に</li>
              <li><span className="font-semibold text-blue-200/90">帽子・ネックウォーマー：</span>体温を逃がさない</li>
            </ul>
          </section>

          <section id="tips" className="scroll-mt-20">
            <h2 className="text-xl font-semibold mb-4 border-b-2 border-blue-300/20 pb-2 text-blue-300 text-glow-weak">
              掬い方のコツ
            </h2>

            <h3 className="text-lg font-semibold text-purple-300 mt-4 mb-2">基本動作</h3>
            <ul className="list-disc list-inside space-y-2">
              <li><span className="font-semibold text-blue-200/90">ライトは2〜3m先の海面を照らす：</span>足元ではなく、少し先の海中を照らすイメージで。光に集まる習性を利用</li>
              <li><span className="font-semibold text-blue-200/90">光と影の境目を狙う：</span>ホタルイカは光の境界に集まりやすいと言われる</li>
              <li><span className="font-semibold text-blue-200/90">網は「押す」のではなく「すくい上げる」：</span>横から滑り込ませて、下から上にすくい上げるのが基本</li>
              <li><span className="font-semibold text-blue-200/90">水面ギリギリで動かす：</span>網を深く沈めすぎないこと。表層数十センチを意識</li>
            </ul>

            <h3 className="text-lg font-semibold text-purple-300 mt-6 mb-2">状況別のテクニック</h3>
            <ul className="list-disc list-inside space-y-2">
              <li><span className="font-semibold text-blue-200/90">湧きの薄い夜：</span>ライトを消したり点けたりして、光に反応する個体を探す。場所を移動する勇気も大切</li>
              <li><span className="font-semibold text-blue-200/90">人が多い場所：</span>ライトが多すぎて逆に湧きが分散することがある。あえてライトを消す、または少し離れて狙う</li>
              <li><span className="font-semibold text-blue-200/90">波が立ち込みやすい場合：</span>引き波のタイミングで前進し、寄せ波で網を構える。波のリズムに合わせる</li>
              <li><span className="font-semibold text-blue-200/90">大量に湧いている時：</span>網を一気に振り回すより、確実に一すくいずつ丁寧に。網が重くなったらすぐにバケツへ移す</li>
            </ul>

            <h3 className="text-lg font-semibold text-purple-300 mt-6 mb-2">よくある失敗</h3>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>柄の短すぎる網を護岸で使ってしまい、目の前のホタルイカに届かない</li>
              <li>ライトの照らし方が下手で、ホタルイカが集まらない</li>
              <li>網を振り回すような動きで、せっかく集まったホタルイカを散らしてしまう</li>
              <li>バケツに真水を入れてしまう（即死するので絶対NG）</li>
              <li>クーラーボックスに直接氷だけ入れて、ホタルイカが冷凍焼け状態になる</li>
            </ul>
          </section>

          <section id="preparation" className="scroll-mt-20">
            <h2 className="text-xl font-semibold mb-4 border-b-2 border-blue-300/20 pb-2 text-blue-300 text-glow-weak">
              持ち帰りと食べ方
            </h2>

            <h3 className="text-lg font-semibold text-purple-300 mt-4 mb-2">持ち帰りの基本</h3>
            <p>
              掬ったホタルイカは、<span className="font-semibold text-blue-200/90">海水＋氷</span>を入れたクーラーボックスで持ち帰るのが基本です。直接氷に触れさせる、解けた真水に浸かる、といった状態は身が傷みやすく味も落ちるので避けましょう。
            </p>
            <ul className="list-disc list-inside mt-3 space-y-1.5 text-base">
              <li>事前にクーラーボックスに海水と板氷を入れておく（現地で海水を汲んで足す）</li>
              <li>ホタルイカは海水の中で「浮かんでいる」状態が理想</li>
              <li>大量に詰め込みすぎず、適度な量で複数のクーラーに分ける</li>
            </ul>

            <h3 className="text-lg font-semibold text-purple-300 mt-6 mb-2">下処理</h3>
            <ul className="list-disc list-inside space-y-2">
              <li><span className="font-semibold text-blue-200/90">流水で軽く洗う：</span>砂や汚れを落とす</li>
              <li><span className="font-semibold text-blue-200/90">目玉・くちばし・軟骨を取る：</span>そのまま食べると食感が悪い。慣れれば1匹10秒程度。料理によっては省略可</li>
              <li><span className="font-semibold text-blue-200/90">大量にある場合は冷凍：</span>ジッパー袋に小分けし、薄く広げて冷凍すれば後日少しずつ使える</li>
            </ul>

            <div className="bg-muted/50 p-5 rounded-lg border border-pink-400/30 mt-6">
              <h3 className="text-lg font-semibold text-pink-300 mb-2">⚠️ 寄生虫の警告（最重要）</h3>
              <p className="text-sm leading-relaxed">
                ホタルイカには <span className="font-semibold text-pink-300">旋尾線虫（せんびせんちゅう）</span> や <span className="font-semibold text-pink-300">アニサキス</span> といった寄生虫がいることがあり、生食は非常に危険です。激しい腹痛や皮膚炎、最悪の場合は腸閉塞を引き起こします。必ず以下のいずれかで処理してから食べてください：
              </p>
              <ul className="list-disc list-inside mt-3 space-y-1 text-sm">
                <li><span className="font-semibold">加熱：</span>沸騰したお湯で30秒以上ボイル（中心まで火を通す）</li>
                <li><span className="font-semibold">冷凍：</span>-30℃で4日以上、または-35℃以下で15時間以上、または-40℃以下で40分以上</li>
              </ul>
              <p className="text-sm mt-3">
                家庭用冷凍庫は-18℃前後しかないため、生食処理には不十分です。生食したい場合は処理済みのものを購入してください。詳しくは
                <Link href="/manners" className="text-blue-400 hover:underline">マナーページ</Link>
                もご確認ください。
              </p>
            </div>
          </section>

          <section id="safety" className="scroll-mt-20">
            <h2 className="text-xl font-semibold mb-4 border-b-2 border-blue-300/20 pb-2 text-blue-300 text-glow-weak">
              安全とマナー
            </h2>
            <p>
              ホタルイカ掬いは深夜の海辺での活動です。波・うねり・寒さ・落水・低体温など、楽しい体験の裏には常にリスクがあります。
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2">
              <li>単独行動は避け、2人以上で行動する</li>
              <li>波・天候を出発前と現地到着時の両方で確認する</li>
              <li>立ち入り禁止区域・私有地・漁港作業エリアには絶対に入らない</li>
              <li>立ち込み時は固形式ライフジャケットを必ず着用</li>
              <li>寒さ対策を妥協しない（低体温症は短時間で進行する）</li>
              <li>子ども連れの場合は必ず手を繋ぎ、波打ち際から離れない</li>
            </ul>
            <p className="mt-4">
              また、漁港や海岸は地元の方の生活の場でもあります。深夜の騒音、違法駐車、ゴミの放置、公共トイレや手洗い場の私物化などは厳禁です。ホタルイカ掬いの文化を未来へつなぐためにも、
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
