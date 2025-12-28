import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // 静的ルート（トップページやAboutページなど）
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // 動的ルート（/detail/[date]）
  const dynamicRoutes: MetadataRoute.Sitemap = [];
  const today = new Date();

  // 昨日から7日後までの9日間をループ
  for (let i = -1; i <= 7; i++) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + i);

    const dateStr = targetDate.toISOString().slice(0, 10);

    dynamicRoutes.push({
      url: `${baseUrl}/detail/${dateStr}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    });
  }

  return [...staticRoutes, ...dynamicRoutes];
}