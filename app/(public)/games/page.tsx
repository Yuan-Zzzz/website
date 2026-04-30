export const dynamic = "force-dynamic";

import Link from "next/link";
import { connectDB } from "@/lib/db";
import Game from "@/models/Game";
import Win95Window from "@/components/win95/Win95Window";
import Win95Button from "@/components/win95/Win95Button";
import Win95Marquee from "@/components/win95/Win95Marquee";
import RainbowText from "@/components/win95/RainbowText";

async function getGames() {
  await connectDB();
  const games = await Game.find({ published: true })
    .sort({ order: 1 })
    .lean();
  return JSON.parse(JSON.stringify(games));
}

export const metadata = {
  title: "游戏作品 - Yuan",
  description: "Yuan 的独立游戏作品",
};

export default async function GamesPage() {
  const games = await getGames();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Win95Window title="Games.exe">
        <div className="text-center py-4">
          <RainbowText as="h1" className="text-3xl md:text-4xl mb-2">
            游戏作品
          </RainbowText>
          <Win95Marquee speed={25} className="py-1 text-xs font-mono">
            <span className="mx-4">Indie Games</span>
            <span className="text-win95-red">★</span>
            <span className="mx-4">Unity</span>
            <span className="text-win95-blue">★</span>
            <span className="mx-4">FNA</span>
            <span className="text-win95-green">★</span>
            <span className="mx-4">MonoGame</span>
            <span className="text-win95-yellow">★</span>
            <span className="mx-4">GameDev</span>
          </Win95Marquee>
        </div>
      </Win95Window>

      {/* Stats */}
      <div className="win95-outset bg-win95-bg p-3">
        <div className="flex items-center gap-4 font-mono text-sm">
          <span>
            Total: <span className="text-win95-green font-bold">{games.length}</span> games
          </span>
          <span>|</span>
          <span className="animate-blink text-win95-red">HOT!</span>
        </div>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {games.map((game: any) => (
          <div key={game._id} className="win95-outset bg-win95-bg">
            <div className="win95-title-bar">
              {game.title}
            </div>
            <div className="p-4">
              <img
                src={game.imageUrl}
                alt={game.title}
                className="w-full h-48 object-cover win95-inset mb-4"
              />
              <p className="text-sm mb-4">{game.description}</p>
              <div className="flex flex-wrap gap-1 mb-4">
                {game.tags?.map((tag: string) => (
                  <span
                    key={tag}
                    className="text-xs font-mono bg-win95-bg win95-outset px-2 py-0.5"
                  >
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
                <Win95Button variant="primary">在 Itch.io 上玩 →</Win95Button>
              </a>
            </div>
          </div>
        ))}
      </div>

      {games.length === 0 && (
        <div className="win95-inset bg-win95-panel p-12 text-center">
          <p className="text-win95-gray font-mono text-lg mb-2">
            [暂无游戏作品]
          </p>
          <p className="text-sm">
            游戏作品将在这里显示，请从后台同步 Itch.io 游戏库。
          </p>
          <Link href="/admin/games" className="no-underline mt-4 inline-block">
            <Win95Button variant="primary">前往后台同步 →</Win95Button>
          </Link>
        </div>
      )}

      {/* Decorative */}
      <div className="construction-stripes h-6" />
    </div>
  );
}
