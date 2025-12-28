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
  
  // タイムゾーン問題を回避するため、すべての日付計算をUTCで統一する
  const today = new Date();
  const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  // 昨日から7日後までの9日間をループ
  for (let i = -1; i <= 7; i++) {
    const targetDate = new Date(todayUTC);
    targetDate.setUTCDate(todayUTC.getUTCDate() + i);

    // toISOString()に頼らず、UTCの日付から直接YYYY-MM-DD形式を生成
    const year = targetDate.getUTCFullYear();
    const month = (targetDate.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = targetDate.getUTCDate().toString().padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    dynamicRoutes.push({
      url: `${baseUrl}/detail/${dateStr}`,
      lastModified: new Date(), // 予報内容は日々変わるため、常に最新として扱う
      changeFrequency: 'daily', // 毎日クロールしてもらう価値がある
      priority: 0.9, // サイトの主要コンテンツのため優先度を高く設定
    });
  }

  return [...staticRoutes, ...dynamicRoutes];
}