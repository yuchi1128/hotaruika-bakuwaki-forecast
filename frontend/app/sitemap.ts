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

  // 動的ルート（/detail/[date]）- 今日と明日の2日分のみ
  const dynamicRoutes: MetadataRoute.Sitemap = [];

  const today = new Date();
  const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  for (let i = 0; i <= 1; i++) {
    const targetDate = new Date(todayUTC);
    targetDate.setUTCDate(todayUTC.getUTCDate() + i);

    const year = targetDate.getUTCFullYear();
    const month = (targetDate.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = targetDate.getUTCDate().toString().padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    dynamicRoutes.push({
      url: `${baseUrl}/detail/${dateStr}`,
      lastModified: todayUTC,
      changeFrequency: 'weekly',
      priority: 0.6,
    });
  }

  return [...staticRoutes, ...dynamicRoutes];
}