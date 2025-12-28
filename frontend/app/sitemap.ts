import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // 1. 静的ルート（トップページやAboutページなど）
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

  // 2. 動的ルート（/detail/[date]）
  // ページ側で受け付けている有効な日付（昨日から6日後まで）のURLのみを生成する
  const dynamicRoutes: MetadataRoute.Sitemap = [];
  const today = new Date();

  // 昨日から6日後までの8日間をループ
  for (let i = -1; i <= 6; i++) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + i);

    // YYYY-MM-DD 形式の文字列に変換
    const dateStr = targetDate.toISOString().slice(0, 10);

    dynamicRoutes.push({
      url: `${baseUrl}/detail/${dateStr}`,
      lastModified: new Date(), // 予報内容は日々変わるため、常に最新として扱う
      changeFrequency: 'daily', // 毎日クロールしてもらう価値がある
      priority: 0.9, // サイトの主要コンテンツのため優先度を高く設定
    });
  }

  return [...staticRoutes, ...dynamicRoutes];
}