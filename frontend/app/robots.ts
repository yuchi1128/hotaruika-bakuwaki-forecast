import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  return {
    rules: [
      {
        // すべてのクローラーを対象
        userAgent: '*',
        // すべてのページを許可
        allow: '/',
        // 以下のパスはクロールを禁止
        disallow: ['/admin/', '/preview/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
