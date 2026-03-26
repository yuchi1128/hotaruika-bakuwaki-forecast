import { ImageResponse } from '@vercel/og';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const runtime = 'nodejs';
export const alt = 'ホタルイカ爆湧き予報 — 富山湾のホタルイカ身投げをAIで予測';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const iconData = await readFile(
    join(process.cwd(), 'public/hotaruika_aikon_3.png')
  );
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
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #312e81 100%)',
        }}
      >
        <img src={iconBase64} width={400} height={400} alt="" />
      </div>
    ),
    { ...size }
  );
}
