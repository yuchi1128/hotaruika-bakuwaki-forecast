import './globals.css';
import type { Metadata } from 'next';
import { Noto_Sans_JP } from 'next/font/google';
import localFont from 'next/font/local';

export const metadata: Metadata = {
  title: 'ホタルイカ爆湧き予報',
  description: '富山湾のホタルイカ身投げをAIで予測。ホタルイカ掬いのタイミングが分かる週間予報に加え、掲示板で現地の最新情報をリアルタイムに交換できます。',
  icons: {
    icon: '/hotaruika_aikon_3.png',
  },
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

// Noto Sans JP (Google Fonts) の設定
const notoSansJp = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-noto-sans-jp',
});

// Zen Kaku Gothic New (ローカルファイル) の設定
const zenKaku = localFont({
  src: [
    {
      path: '../public/fonts/ZenKakuGothicNew-Regular.ttf',
      weight: '400',
    },
    {
      path: '../public/fonts/ZenKakuGothicNew-Bold.ttf',
      weight: '700',
    },
  ],
  display: 'swap',
  variable: '--font-zen-kaku',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={`${zenKaku.variable} ${notoSansJp.variable}`}>
        <div className="fixed inset-0 z-[-1] bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900" />
        <div className="stars">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="star"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 4}s`,
              }}
            />
          ))}
        </div>
        <main className="relative z-10">{children}</main>
      </body>
    </html>
  );
}