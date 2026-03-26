import { ImageResponse } from '@vercel/og';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const runtime = 'nodejs';
export const alt = 'ホタルイカ爆湧き予報 — 富山湾のホタルイカ身投げをAIで予測';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const [fontData, iconData] = await Promise.all([
    readFile(join(process.cwd(), 'public/fonts/ZenKakuGothicNew-Bold.ttf')),
    readFile(join(process.cwd(), 'public/hotaruika_aikon_3.png')),
  ]);

  const iconBase64 = `data:image/png;base64,${iconData.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #312e81 100%)',
          fontFamily: '"Zen Kaku Gothic New"',
        }}
      >
        <img
          src={iconBase64}
          width={240}
          height={240}
          style={{ marginRight: 48 }}
          alt=""
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.2,
              backgroundImage: 'linear-gradient(to right, #93c5fd, #d8b4fe, #f9a8d4)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            ホタルイカ爆湧き予報
          </div>
          <div
            style={{
              fontSize: 28,
              color: '#bfdbfe',
              lineHeight: 1.5,
              maxWidth: 600,
            }}
          >
            ホタルイカの身投げをAIで予測
          </div>
          <div
            style={{
              fontSize: 24,
              color: '#93c5fd',
              marginTop: 8,
            }}
          >
            bakuwaki.jp
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Zen Kaku Gothic New',
          data: fontData,
          style: 'normal',
          weight: 700,
        },
      ],
    }
  );
}
