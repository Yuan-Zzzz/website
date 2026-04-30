export const dynamic = "force-dynamic";

import Link from "next/link";
import { connectDB } from "@/lib/db";
import Article from "@/models/Article";
import Game from "@/models/Game";
import Win95Window from "@/components/win95/Win95Window";
import Win95Button from "@/components/win95/Win95Button";

async function getStats() {
  await connectDB();
  const articlesCount = await Article.countDocuments();
  const gamesCount = await Game.countDocuments();
  const publishedArticles = await Article.countDocuments({ published: true });
  const publishedGames = await Game.countDocuments({ published: true });
  return { articlesCount, gamesCount, publishedArticles, publishedGames };
}

export default async function AdminDashboardPage() {
  const stats = await getStats();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-black">控制面板</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Win95Window title="Articles.dat">
          <div className="text-center py-4">
            <div className="text-3xl font-display font-black text-win95-blue">
              {stats.articlesCount}
            </div>
            <div className="text-xs font-mono text-win95-gray">文章总数</div>
          </div>
        </Win95Window>

        <Win95Window title="Games.dat">
          <div className="text-center py-4">
            <div className="text-3xl font-display font-black text-win95-green">
              {stats.gamesCount}
            </div>
            <div className="text-xs font-mono text-win95-gray">游戏总数</div>
          </div>
        </Win95Window>

        <Win95Window title="Pub.dat">
          <div className="text-center py-4">
            <div className="text-3xl font-display font-black text-win95-red">
              {stats.publishedArticles}
            </div>
            <div className="text-xs font-mono text-win95-gray">已发布文章</div>
          </div>
        </Win95Window>

        <Win95Window title="Pub2.dat">
          <div className="text-center py-4">
            <div className="text-3xl font-display font-black text-win95-yellow">
              {stats.publishedGames}
            </div>
            <div className="text-xs font-mono text-win95-gray">已发布游戏</div>
          </div>
        </Win95Window>
      </div>

      {/* Quick Actions */}
      <Win95Window title="Actions.exe">
        <h2 className="text-lg font-display font-black mb-4">快捷操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="win95-outset bg-win95-bg p-4">
            <h3 className="font-bold mb-2">文章管理</h3>
            <div className="flex gap-2 flex-wrap">
              <Link href="/admin/articles" className="no-underline">
                <Win95Button>查看全部</Win95Button>
              </Link>
              <Link href="/admin/articles/new" className="no-underline">
                <Win95Button variant="primary">新建文章</Win95Button>
              </Link>
            </div>
          </div>

          <div className="win95-outset bg-win95-bg p-4">
            <h3 className="font-bold mb-2">游戏管理</h3>
            <div className="flex gap-2 flex-wrap">
              <Link href="/admin/games" className="no-underline">
                <Win95Button>查看全部 / 同步</Win95Button>
              </Link>
            </div>
          </div>
        </div>
      </Win95Window>
    </div>
  );
}
