import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ホタルイカ爆湧き予報',
  description: '富山湾のホタルイカ身投げ量をAIで予測。今日から一週間の予測と口コミ情報をお届けします。',
  icons: {
    icon: '/hotaruika_aikon_2.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
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
        {children}
      </body>
    </html>
  );
}