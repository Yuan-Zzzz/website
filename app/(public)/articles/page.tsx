export const dynamic = "force-dynamic";

import Link from "next/link";
import { connectDB } from "@/lib/db";
import Article from "@/models/Article";
import Win95Window from "@/components/win95/Win95Window";
import Win95Marquee from "@/components/win95/Win95Marquee";

async function getArticles() {
  await connectDB();
  const articles = await Article.find({ published: true })
    .sort({ date: -1 })
    .lean();
  return JSON.parse(JSON.stringify(articles));
}

export const metadata = {
  title: "文章 - Yuan",
  description: "Yuan 的技术文章和游戏开发心得",
};

export default async function ArticlesPage() {
  const articles = await getArticles();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Win95Window title="Articles.txt">
        <div className="text-center py-4">
          <h1 className="text-3xl font-display font-black mb-2">文章</h1>
          <Win95Marquee speed={30} className="py-1 text-xs font-mono">
            <span className="mx-4">Unity</span>
            <span className="text-win95-red">★</span>
            <span className="mx-4">C#</span>
            <span className="text-win95-blue">★</span>
            <span className="mx-4">Graphics</span>
            <span className="text-win95-green">★</span>
            <span className="mx-4">GameDev</span>
            <span className="text-win95-yellow">★</span>
            <span className="mx-4">FNA</span>
            <span className="text-win95-red">★</span>
            <span className="mx-4">MonoGame</span>
          </Win95Marquee>
        </div>
      </Win95Window>

      {/* Stats */}
      <div className="win95-outset bg-win95-bg p-3">
        <div className="flex items-center gap-4 font-mono text-sm">
          <span>Total: <span className="text-win95-green font-bold">{articles.length}</span> articles</span>
          <span>|</span>
          <span>Last updated: {articles[0] ? new Date(articles[0].date).toLocaleDateString("zh-CN") : "N/A"}</span>
        </div>
      </div>

      {/* Articles List */}
      <div className="space-y-3">
        {articles.map((article: any, index: number) => (
          <Link
            key={article._id}
            href={`/articles/${article.slug}`}
            className="block no-underline"
          >
            <div className={`win95-outset p-3 hover:bg-[#D0D0D0] transition-none ${index % 2 === 0 ? 'bg-white' : 'bg-[#E8E8E8]'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-display font-black truncate">
                    {article.title}
                  </h2>
                  <p className="text-sm text-win95-gray line-clamp-2 mt-1">
                    {article.excerpt}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {article.tags?.map((tag: string) => (
                      <span
                        key={tag}
                        className="text-xs font-mono bg-win95-bg win95-outset px-1"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs font-mono text-win95-gray">
                    {new Date(article.date).toLocaleDateString("zh-CN")}
                  </span>
                  {article.categories?.length > 0 && (
                    <span className="text-xs font-mono text-win95-blue">
                      {article.categories[0]}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {articles.length === 0 && (
        <div className="win95-inset bg-win95-panel p-8 text-center">
          <p className="text-win95-gray font-mono text-lg">
            [暂无文章]
          </p>
          <p className="text-sm mt-2">文章将在这里显示</p>
        </div>
      )}
    </div>
  );
}
