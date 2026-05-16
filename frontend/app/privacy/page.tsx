import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PrivacyPage = () => {
  return (
    <div className="container mx-auto p-4 md:p-8">
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
          <CardTitle className="text-xl md:text-3xl font-bold text-center bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent py-2">
            プライバシーポリシー
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8 text-sm md:text-lg leading-[1.8] text-foreground/90">
          <section>
            <p>
              「ホタルイカ爆湧き予報」（以下「当サイト」といいます）は、ユーザーの個人情報の取り扱いについて、以下のとおりプライバシーポリシーを定めます。当サイトをご利用いただく際は、本ポリシーに同意いただいたものとみなします。
            </p>
          </section>

          <section>
            <h2 className="text-base md:text-xl font-semibold mb-4 border-b-2 border-blue-300/20 pb-2 text-blue-300 text-glow-weak">
              1. 取得する情報
            </h2>
            <p>
              当サイトでは、サービスの提供および改善のため、以下の情報を取得することがあります。
            </p>
            <ul className="list-none mt-4 space-y-2 bg-muted/50 p-6 rounded-lg border border-blue-400/10">
              <li><span className="font-bold text-purple-300">デバイス識別子（匿名ID）</span></li>
              <li><span className="font-bold text-purple-300">投稿内容</span>（本文・ユーザー名・画像）</li>
              <li><span className="font-bold text-purple-300">アクセスログ</span>（IPアドレス、ブラウザ種別、アクセス日時等）</li>
              <li><span className="font-bold text-purple-300">操作履歴</span>（投票・リアクション等）</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base md:text-xl font-semibold mb-4 border-b-2 border-blue-300/20 pb-2 text-blue-300 text-glow-weak">
              2. 情報の利用目的
            </h2>
            <p>
              取得した情報は、以下の目的で利用します。
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2">
              <li>掲示板機能やアンケート機能などのサービス提供のため</li>
              <li>不正利用・荒らし行為の防止およびモデレーションのため</li>
              <li>サービスの品質改善および新機能の開発のため</li>
              <li>利用状況の分析・統計のため</li>
              <li>法令に基づく対応のため</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base md:text-xl font-semibold mb-4 border-b-2 border-blue-300/20 pb-2 text-blue-300 text-glow-weak">
              3. Cookie と localStorage の利用について
            </h2>
            <p>
              当サイトでは、機能の提供のため Cookie および localStorage を利用しています。具体的には、投稿者の識別、ログイン状態の保持、投票履歴の記録などに使用します。
            </p>
            <p className="mt-4">
              Cookie および localStorage は、ブラウザの設定からいつでも削除・無効化できます。
            </p>
          </section>

          <section>
            <h2 className="text-base md:text-xl font-semibold mb-4 border-b-2 border-blue-300/20 pb-2 text-blue-300 text-glow-weak">
              4. 海外サーバーへのデータ保管について
            </h2>
            <p>
              当サイトのデータは、Supabase（米国）、Vercel（米国）、Google Cloud Platform（日本）のクラウドサービスに保管されます。各事業者のプライバシーポリシーに従って取り扱われます。
            </p>
          </section>

          <section>
            <h2 className="text-base md:text-xl font-semibold mb-4 border-b-2 border-blue-300/20 pb-2 text-blue-300 text-glow-weak">
              5. 広告配信について
            </h2>
            <p>
              現在、当サイトでは広告の配信は行っておりません。
            </p>
            <p className="mt-4">
              今後、サイト運営費用を補うため、Google AdSense をはじめとする広告配信サービスを導入する可能性があります。導入された場合、以下の点にご留意ください。
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2">
              <li>Google を含む第三者配信事業者は、Cookie を使用して、ユーザーが過去に当サイトや他のウェブサイトへアクセスした情報に基づいて広告を配信することがあります。</li>
              <li>Google が広告 Cookie を使用することにより、Google やそのパートナーがユーザーに対して適切な広告を表示できるようになります。</li>
              <li>ユーザーは、<Link href="https://www.google.com/settings/ads" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">Google 広告設定</Link> でパーソナライズド広告を無効にできます。</li>
              <li>パーソナライズド広告に対応している第三者配信事業者を利用する場合があります。これらの事業者によるオプトアウトは <Link href="https://www.aboutads.info/choices/" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">aboutads.info</Link> から行えます。</li>
            </ul>
            <p className="mt-4">
              広告配信を実際に開始する際には、本ポリシーを更新してお知らせします。
            </p>
          </section>

          <section>
            <h2 className="text-base md:text-xl font-semibold mb-4 border-b-2 border-blue-300/20 pb-2 text-blue-300 text-glow-weak">
              6. 第三者への情報提供
            </h2>
            <p>
              当サイトは、以下の場合を除き、取得した情報を第三者に提供することはありません。
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2">
              <li>ユーザーご本人の同意がある場合</li>
              <li>法令に基づき開示が求められる場合</li>
              <li>人の生命、身体または財産の保護のために必要がある場合</li>
              <li>本ポリシー第4項に記載のクラウドサービス事業者に対し、サービス提供に必要な範囲でデータを保管・処理させる場合</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base md:text-xl font-semibold mb-4 border-b-2 border-blue-300/20 pb-2 text-blue-300 text-glow-weak">
              7. 投稿コンテンツの取り扱い
            </h2>
            <p>
              掲示板に投稿された内容は、当サイトのサービス内で他のユーザーに表示されます。投稿前に、個人を特定できる情報や他者に開示したくない情報を含めていないか十分にご確認ください。
            </p>
            <p className="mt-4">
              利用規約に違反する投稿、または運営者が不適切と判断した投稿は、予告なく削除する場合があります。また、悪質な利用者については、デバイス単位での投稿制限を行うことがあります。
            </p>
          </section>

          <section>
            <h2 className="text-base md:text-xl font-semibold mb-4 border-b-2 border-blue-300/20 pb-2 text-blue-300 text-glow-weak">
              8. データの保管期間と削除のご依頼
            </h2>
            <p>
              取得した情報は、サービス提供に必要な期間および法令で定められた期間、保管します。ご自身の投稿の削除や、保存されているデータの削除をご希望の場合は、後述のお問い合わせ先までご連絡ください。
            </p>
          </section>

          <section>
            <h2 className="text-base md:text-xl font-semibold mb-4 border-b-2 border-blue-300/20 pb-2 text-blue-300 text-glow-weak">
              9. 未成年者の利用について
            </h2>
            <p>
              未成年の方が当サイトをご利用になる場合は、保護者の方の同意のもとでご利用ください。
            </p>
          </section>

          <section>
            <h2 className="text-base md:text-xl font-semibold mb-4 border-b-2 border-blue-300/20 pb-2 text-blue-300 text-glow-weak">
              10. プライバシーポリシーの変更について
            </h2>
            <p>
              本ポリシーの内容は、法令の変更やサービス内容の変更に応じて、予告なく改定することがあります。改定後のポリシーは、当サイトに掲載した時点で効力を生じるものとします。
            </p>
          </section>

          <section>
            <h2 className="text-base md:text-xl font-semibold mb-4 border-b-2 border-blue-300/20 pb-2 text-blue-300 text-glow-weak">
              11. お問い合わせ
            </h2>
            <p>
              本ポリシーに関するお問い合わせや、データの削除依頼などは、以下までご連絡ください。
            </p>
            <ul className="list-none mt-4 space-y-2 bg-muted/50 p-6 rounded-lg border border-blue-400/10">
              <li>
                <span className="font-bold text-purple-300">メール：</span>{' '}
                <Link href="mailto:bakuwaki.jp@gmail.com" className="text-blue-400 hover:underline">
                  bakuwaki.jp@gmail.com
                </Link>
              </li>
              <li>
                <span className="font-bold text-purple-300">X (旧Twitter)：</span>{' '}
                <Link href="https://x.com/bakuwaki_jp" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">
                  @bakuwaki_jp
                </Link>
              </li>
            </ul>
          </section>

          <section className="text-right text-xs md:text-sm text-foreground/60 pt-4">
            <p>制定日: 2026年5月16日</p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyPage;
