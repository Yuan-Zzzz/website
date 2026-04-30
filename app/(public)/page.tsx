export const dynamic = "force-dynamic";

import Link from "next/link";
import { connectDB } from "@/lib/db";
import Article from "@/models/Article";
import Game from "@/models/Game";
import Win95Window from "@/components/win95/Win95Window";
import Win95Button from "@/components/win95/Win95Button";
import Win95Marquee from "@/components/win95/Win95Marquee";
import RainbowText from "@/components/win95/RainbowText";

async function getArticles() {
  await connectDB();
  const articles = await Article.find({ published: true })
    .sort({ date: -1 })
    .limit(5)
    .lean();
  return JSON.parse(JSON.stringify(articles));
}

async function getGames() {
  await connectDB();
  const games = await Game.find({ published: true })
    .sort({ order: 1 })
    .limit(4)
    .lean();
  return JSON.parse(JSON.stringify(games));
}

export default async function HomePage() {
  const articles = await getArticles();
  const games = await getGames();

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center py-8">
        <Win95Window title="Welcome.exe" className="max-w-2xl mx-auto">
          <div className="py-8">
            <RainbowText as="h1" className="text-4xl md:text-6xl mb-4">
              YUAN
            </RainbowText>
            <p className="text-lg font-mono text-win95-gray mb-4">
              游戏开发者，以及厨子
            </p>
            <Win95Marquee speed={25} className="py-2 text-sm font-mono">
              <span className="text-win95-red">★</span>
              <span className="mx-4">Unity Developer</span>
              <span className="text-win95-blue">★</span>
              <span className="mx-4">Indie Game Maker</span>
              <span className="text-win95-green">★</span>
              <span className="mx-4">C# / Graphics / FNA</span>
              <span className="text-win95-yellow">★</span>
              <span className="mx-4">Welcome to my homepage!</span>
            </Win95Marquee>
          </div>
        </Win95Window>
      </section>

      {/* About Section */}
      <section id="about">
        <Win95Window title="About.txt" className="max-w-3xl mx-auto">
          <div className="space-y-4">
            <h2 className="text-xl font-display font-black">关于我</h2>
            <p>
              你好！我是 Yuan，一名热爱游戏开发的程序员。我主要使用 Unity 和 C# 进行开发，
              也对图形渲染、游戏引擎底层技术有浓厚兴趣。
            </p>
            <p>
              除了写代码，我还喜欢研究美食，所以你可以在我的文章中看到技术和烹饪的奇妙结合。
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              {["Unity", "C#", "Graphics", "FNA", "MonoGame", "Game Design"].map((tag) => (
                <span
                  key={tag}
                  className="win95-inset bg-win95-panel px-2 py-1 text-xs font-mono"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </Win95Window>
      </section>

      {/* Games Section */}
      <section id="games">
        <Win95Window title="Games.exe">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-black">游戏作品</h2>
            <Link href="/games" className="no-underline">
              <Win95Button>查看全部 →</Win95Button>
            </Link>
          </div>

          {games.length === 0 ? (
            <div className="win95-inset bg-win95-panel p-8 text-center">
              <p className="text-win95-gray font-mono">
                [暂无游戏作品]
              </p>
              <p className="text-sm mt-2">请从后台同步 Itch.io 游戏库</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {games.map((game: any) => (
                <div key={game._id} className="win95-outset bg-win95-bg">
                  <div className="win95-title-bar">
                    {game.title}
                  </div>
                  <div className="p-3">
                    <img
                      src={game.imageUrl}
                      alt={game.title}
                      className="w-full h-40 object-cover win95-inset mb-3"
                    />
                    <p className="text-sm line-clamp-2 mb-3">{game.description}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {game.tags?.map((tag: string) => (
                        <span key={tag} className="text-xs font-mono bg-win95-bg win95-outset px-1">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <a
                      href={game.itchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="no-underline"
                    >
                      <Win95Button variant="primary">在 Itch.io 上玩</Win95Button>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Win95Window>
      </section>

      {/* Articles Section */}
      <section id="articles">
        <Win95Window title="Articles.txt">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-black">最新文章</h2>
            <Link href="/articles" className="no-underline">
              <Win95Button>查看全部 →</Win95Button>
            </Link>
          </div>

          {articles.length === 0 ? (
            <div className="win95-inset bg-win95-panel p-8 text-center">
              <p className="text-win95-gray font-mono">
                [暂无文章]
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {articles.map((article: any) => (
                <Link
                  key={article._id}
                  href={`/articles/${article.slug}`}
                  className="block no-underline"
                >
                  <div className="win95-outset bg-win95-bg p-3 hover:bg-[#D0D0D0] transition-none">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-display font-black truncate">
                          {article.title}
                        </h3>
                        <p className="text-sm text-win95-gray line-clamp-2 mt-1">
                          {article.excerpt}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-xs font-mono text-win95-gray">
                          {new Date(article.date).toLocaleDateString("zh-CN")}
                        </span>
                        {article.tags?.length > 0 && (
                          <span className="text-xs font-mono text-win95-blue">
                            {article.tags[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Win95Window>
      </section>

      {/* Contact Section */}
      <section id="contact">
        <Win95Window title="Contact.exe">
          <h2 className="text-xl font-display font-black mb-4">联系方式</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="win95-inset bg-white p-3">
              <div className="font-mono text-sm space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-win95-blue">●</span>
                  <span>GitHub: </span>
                  <a href="https://github.com/Yuan-Zzzz" target="_blank" rel="noopener noreferrer">
                    @Yuan-Zzzz
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-win95-red">●</span>
                  <span>Bilibili: </span>
                  <a href="#" target="_blank" rel="noopener noreferrer">
                    Yuan的频道
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-win95-green">●</span>
                  <span>Email: </span>
                  <a href="mailto:contact@yuan-zzzz.com">
                    contact@yuan-zzzz.com
                  </a>
                </div>
              </div>
            </div>
            <div className="win95-inset bg-win95-panel p-3">
              <p className="text-sm font-mono">
                欢迎交流合作！<br />
                无论是游戏开发、技术讨论还是随便聊聊，都可以联系我。
              </p>
            </div>
          </div>
        </Win95Window>
      </section>

      {/* Decorative Section */}
      <section>
        <div className="construction-stripes h-8 flex items-center justify-center">
          <span className="text-win95-black font-display font-black text-sm bg-win95-yellow px-2">
            UNDER CONSTRUCTION
          </span>
        </div>
      </section>
    </div>
  );
}
