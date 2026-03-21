'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MannersPopup from '@/components/common/MannersPopup';

const MannersPage = () => {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <MannersPopup />
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
          <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent py-2">
            ホタルイカ掬いのマナー
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8 text-base md:text-lg leading-relaxed text-foreground">
          <p>
            ホタルイカ掬いは富山湾の春の風物詩です。この素晴らしい体験をこれからも皆さまが気持ちよく楽しめるよう、マナーへのご理解・ご協力をお願いいたします。
          </p>

          <section>
            <h2 className="text-xl font-semibold mb-4 border-b-2 border-blue-300/20 pb-2 text-blue-300 text-glow-weak">近隣住民への配慮</h2>
            <ul className="list-disc list-inside space-y-3">
              <li><span className="font-semibold text-blue-200/90">深夜の騒音に注意：</span>車のドアの開閉音、エンジンのかけっぱなし、大声での会話はお控えください。</li>
              <li><span className="font-semibold text-blue-200/90">迷惑駐車の禁止：</span>漁港関係者や近隣住民の迷惑になる場所、私有地、路上への違法駐車は厳禁です。決められた駐車スペースをご利用ください。自分のいる場所に「侵入禁止」「立ち入り禁止」「駐車禁止」等の看板が無いか、今一度周囲をよく確認してから駐車しましょう。</li>
              <li><span className="font-semibold text-blue-200/90">駐車スペースの占拠禁止：</span>数台分の駐車スペースを1人で占拠したり、クーラーボックス等の荷物で場所取りをする行為はおやめください。駐車スペースは1台につき1台分を守りましょう。</li>
              <li><span className="font-semibold text-blue-200/90">漁業関係者への配慮：</span>漁港は漁師さんの仕事場です。作業の邪魔にならないようにし、ロープや網などの漁具には絶対に触れないでください。</li>
              <li><span className="font-semibold text-blue-200/90">深夜のアイドリングストップ：</span>防寒着をしっかり着用し、車のエンジンをかけたままの待機はご遠慮ください。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 border-b-2 border-blue-300/20 pb-2 text-blue-300 text-glow-weak">環境と資源の保護</h2>
            <ul className="list-disc list-inside space-y-3">
              <li><span className="font-semibold text-blue-200/90">ゴミの持ち帰り：</span>飲食のゴミ、壊れた網や仕掛けなどは必ず各自で持ち帰ってください。</li>
              <li><span className="font-semibold text-blue-200/90">公衆トイレや手洗い場の私物化禁止：</span>公共のトイレや洗い場は、あくまで「共有の施設」です。大量のホタルイカを洗う、クーラーボックスや網などの道具を広げるなど、長時間にわたって場所を占領する行為は絶対におやめください。他の利用者や地元の方、施設の管理者が困るような使い方はおやめください。</li>
              <li><span className="font-semibold text-blue-200/90">喫煙マナーの徹底：</span>海岸や駐車場での喫煙はご遠慮ください。近隣の方からタバコのポイ捨てによる苦情も寄せられています。喫煙は喫煙所か、ご自身の車内でお願いいたします。</li>
              <li><span className="font-semibold text-blue-200/90">火気の使用禁止：</span>駐車場や砂浜での七輪・バーベキューなどの火気の使用はおやめください。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 border-b-2 border-blue-300/20 pb-2 text-blue-300 text-glow-weak">周囲の掬う人への配慮</h2>
            <ul className="list-disc list-inside space-y-3">
              <li><span className="font-semibold text-blue-200/90">ライトの照らし方：</span>釣りをしている方がいる場所で強力なライトで無闇に海面を照らし続けると釣り人の迷惑になります。また、人の顔に向けてライトを照らさないようご注意ください。</li>
              <li><span className="font-semibold text-blue-200/90">場所の譲り合い：</span>限られたスペースをお互いに譲り合って楽しみましょう。割り込みや、過度な場所取りは禁止です。</li>
              <li><span className="font-semibold text-blue-200/90">長いタモ網の取り扱い：</span>周囲を確認してから網を振るようにしてください。後ろを通る人や車にぶつける事故にご注意ください。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 border-b-2 border-blue-300/20 pb-2 text-blue-300 text-glow-weak">安全・衛生対策</h2>
            <ul className="list-disc list-inside space-y-3">
              <li><span className="font-semibold text-blue-200/90">危険な場所への立ち入り禁止：</span>漁業関係者専用の敷地や、立ち入りが制限されている防波堤への侵入は「不法侵入」となります。警察に通報される事案も発生しています。危険なテトラポッドの上なども含め、指定された安全なエリア以外での活動は絶対に行わないでください。「侵入禁止」「立ち入り禁止」等の看板が無いか、行動する前に必ず周囲をご確認ください。</li>
              <li><span className="font-semibold text-blue-200/90">寄生虫（旋尾線虫・アニサキス）の警告：</span>ホタルイカの生食は大変危険です。必ず加熱（ボイル）するか、規定の温度・期間で適切に冷凍処理を行ってください。</li>
            </ul>
          </section>

          <div className="bg-muted/50 p-6 rounded-lg border border-blue-400/10 text-center">
            <p className="text-xs text-foreground/70">
              このマナーページは、当サイトの掲示板に寄せられた皆さまの声をもとに作成しています。ホタルイカ掬いの文化を未来へつなぐために、一人ひとりのご協力をお願いいたします。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MannersPage;
