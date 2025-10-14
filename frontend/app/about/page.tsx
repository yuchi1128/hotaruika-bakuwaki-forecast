import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AboutPage = () => {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card className="max-w-4xl mx-auto bg-card/80 backdrop-blur-sm border-blue-400/20">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent py-2">
            このサイトについて
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8 text-lg leading-relaxed text-foreground/90">
          <section>
            <h2 className="text-2xl font-semibold mb-4 border-b-2 border-blue-300/20 pb-2 text-blue-300 text-glow-weak">「ホタルイカ爆湧き予報」へようこそ</h2>
            <p>
              このサイトは、富山湾の神秘であるホタルイカの身投げ量を予測し、その魅力を多くの人々と共有するために作られました。ホタルイカ掬いや観光に訪れる方々などホタルイカを愛するすべての人に、信頼性の高い情報を提供することを目指しています。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 border-b-2 border-blue-300/20 pb-2 text-blue-300 text-glow-weak">「身投げ」とは？</h2>
            <p>
              身投げとは、ホタルイカが産卵のために海岸近くまで押し寄せる現象を指します。この現象は、特定の自然条件が揃ったときに発生し、「爆湧き」時には海岸が青白い光で埋め尽くされる幻想的な光景を見ることができます。
            </p>
            <p className="mt-4">
              「爆湧き」は主に、以下の条件が重なった時に起こりやすいと言われています。
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 bg-muted/50 p-6 rounded-lg border border-blue-400/10">
              <li><span className="font-bold text-purple-300">月齢：</span> 新月の前後、月明かりが少ない夜。</li>
              <li><span className="font-bold text-purple-300">潮汐：</span> 満潮に近い時間帯。</li>
              <li><span className="font-bold text-purple-300">天候：</span> 晴れて波が穏やかな日。</li>
              <li><span className="font-bold text-purple-300">風向：</span> 南風が吹き、沖合のホタルイカが岸に寄せられるとき。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 border-b-2 border-blue-300/20 pb-2 text-blue-300 text-glow-weak">当サイトの機能</h2>
            <p>
              本サイトでは、これらの条件を総合的に分析し、独自のアルゴリズムに基づいて「湧き指数」を算出しています。
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 text-base">
              <li><span className="font-semibold text-blue-200/90">身投げ量予報：</span> 先7日間の爆湧き期待度を指数で確認できます。</li>
              <li><span className="font-semibold text-blue-200/90">詳細情報：</span> 日付ごとの時間帯別の天気、波の高さ、潮位、月齢などの詳細なデータを提供します。</li>
              <li><span className="font-semibold text-blue-200/90">コミュニティ機能：</span> 現地の最新情報やホタルイカに関する話題を共有・交換する交流の場としてご利用ください。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 border-b-2 border-blue-300/20 pb-2 text-blue-300 text-glow-weak">湧き指数の算出方法</h2>
            <p>
              当サイトの「湧き指数」は、AI（人工知能）技術を活用した独自の予測モデルで算出されており、この指数の値から「爆湧き」などの湧きレベルを判定しています。予測モデルは、ホタルイカの過去の出現量と、その日の様々なデータとの関係をAIが学習し、未来の出現量を予測する仕組みです。
            </p>
            <p className="mt-4">
              予測には、主に以下のようなデータが使われています。
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-base">
              <div className="bg-muted/40 p-4 rounded-lg border border-blue-400/10">
                <h3 className="font-semibold text-purple-300">夜間の気象データ</h3>
                <p className="text-sm text-foreground/80 mt-1">気温、降水量、風の強さや向きなど、ホタルイカが活動する夜間の天候を重視しています。</p>
              </div>
              <div className="bg-muted/40 p-4 rounded-lg border border-blue-400/10">
                <h3 className="font-semibold text-purple-300">月齢データ</h3>
                <p className="text-sm text-foreground/80 mt-1">月の満ち欠け（月齢）は、夜の明るさに影響し、ホタルイカの行動に関係すると言われています。</p>
              </div>
              <div className="bg-muted/40 p-4 rounded-lg border border-blue-400/10">
                <h3 className="font-semibold text-purple-300">カレンダーの情報</h3>
                <p className="text-sm text-foreground/80 mt-1">季節の進み具合なども考慮に入れています。</p>
              </div>
              <div className="bg-muted/40 p-4 rounded-lg border border-blue-400/10">
                <h3 className="font-semibold text-purple-300">前日・前々日のデータ</h3>
                <p className="text-sm text-foreground/80 mt-1">その日の状況だけでなく、前日や前々日の気象データなども、予測の重要な要素となります。</p>
              </div>
            </div>
            <p className="mt-4">
              AIはこれらのデータから複雑なパターンを見つけ出し、単純な条件だけでは分からない関係性を捉えて、その日の「湧き指数」を算出します。このモデルは新しいデータを継続的に学習し、日々精度を向上させています。
            </p>
          </section>

          <section>
            <p className="text-center text-xl font-medium text-foreground/80 pt-4">
              皆様のホタルイカ体験が、より豊かで素晴らしいものになることを願っています。
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default AboutPage;
