import { MetadataRoute } from 'next';

type Post = {
  id: number;
  username: string;
  content: string;
  image_urls: string | null;
  label: string;
  created_at: string;
  good_count: number;
  bad_count: number;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

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

  let dynamicRoutes: MetadataRoute.Sitemap = [];

  try {
    // APIから投稿データを取得
    // revalidate: 3600 (1時間) を設定し、毎回バックエンドにリクエストが飛ばないようにする
    const response = await fetch(`${backendUrl}/api/posts`, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.statusText}`);
    }

    const posts: Post[] = await response.json();

    const uniqueDates = new Map<string, string>();

    posts.forEach((post) => {
      const dateStr = post.created_at.slice(0, 10);
      
      if (!uniqueDates.has(dateStr) || new Date(post.created_at) > new Date(uniqueDates.get(dateStr)!)) {
        uniqueDates.set(dateStr, post.created_at);
      }
    });

    // 重複のないMapからサイトマップの配列を作成
    dynamicRoutes = Array.from(uniqueDates.entries()).map(([dateStr, lastMod]) => {
      return {
        url: `${baseUrl}/detail/${dateStr}`,
        lastModified: new Date(lastMod),
        changeFrequency: 'weekly',
        priority: 0.8,
      };
    });

  } catch (error) {
    console.error("Sitemap generation error:", error);
  }

  return [...staticRoutes, ...dynamicRoutes];
}