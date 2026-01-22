import './globals.css';
import type { Metadata } from 'next';
import { Zen_Kaku_Gothic_New } from 'next/font/google';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const SITE_NAME = 'ホタルイカ爆湧き予報';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: SITE_NAME,
  description: '富山湾のホタルイカ身投げをAIで予測。ホタルイカ掬いのタイミングが分かる週間予報に加え、掲示板で現地の最新情報をリアルタイムに交換できます。',
  icons: {
    icon: '/hotaruika_aikon_3.png',
  },
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  // OGP設定（SNSや検索エンジンへの明示）
  openGraph: {
    title: SITE_NAME,
    description: '富山湾のホタルイカ身投げをAIで予測。掲示板で現地の最新情報をリアルタイムに交換できます。',
    url: baseUrl,
    siteName: SITE_NAME,
    locale: 'ja_JP',
    type: 'website',
  },
  verification: {
    google: 'DUbWjtDoIJaM6FOqA7i3KI34R7GrC_Og6xCWjjsfjBw',
  },
};

// Zen Kaku Gothic New (Google Fonts) の設定
const zenKaku = Zen_Kaku_Gothic_New({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-zen-kaku',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Google検索用の構造化データ (JSON-LD)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    alternateName: 'bakuwaki.jp',
    url: baseUrl,
  };

  return (
    <html lang="ja">
      <body className={zenKaku.variable}>
        {/* JSON-LDスクリプト */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

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