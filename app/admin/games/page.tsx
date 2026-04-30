"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Win95Window from "@/components/win95/Win95Window";
import Win95Button from "@/components/win95/Win95Button";
import Win95Input from "@/components/win95/Win95Input";

interface Game {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  itchUrl: string;
  published: boolean;
  tags: string[];
  order: number;
}

export default function AdminGamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchGames();
  }, []);

  async function fetchGames() {
    try {
      setLoading(true);
      const res = await fetch("/api/games");
      const data = await res.json();
      if (data.success) {
        setGames(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch games:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    if (!apiKey.trim()) {
      setMessage("请输入 Itch.io API Key");
      return;
    }

    setSyncing(true);
    setMessage("");

    try {
      const res = await fetch("/api/games/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage(data.message);
        await fetchGames();
        router.refresh();
      } else {
        setMessage(`同步失败: ${data.error}`);
      }
    } catch {
      setMessage("网络错误，同步失败");
    } finally {
      setSyncing(false);
    }
  }

  async function deleteGame(id: string) {
    if (!confirm("确定要删除这个游戏吗？此操作不可撤销。")) return;

    try {
      const res = await fetch(`/api/games/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setGames(games.filter((g) => g._id !== id));
        router.refresh();
      } else {
        alert(data.error || "删除失败");
      }
    } catch {
      alert("网络错误");
    }
  }

  async function togglePublish(id: string, published: boolean) {
    try {
      const res = await fetch(`/api/games/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !published }),
      });
      const data = await res.json();
      if (data.success) {
        setGames(
          games.map((g) =>
            g._id === id ? { ...g, published: !published } : g
          )
        );
      }
    } catch {
      alert("操作失败");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-black">游戏管理</h1>
        <Link href="/admin" className="no-underline">
          <Win95Button>← 返回控制面板</Win95Button>
        </Link>
      </div>

      {/* Sync Panel */}
      <Win95Window title="Sync_Itch.exe">
        <div className="space-y-4">
          <p className="text-sm">
            输入你的 Itch.io API Key，点击同步即可从 Itch.io 游戏库拉取游戏数据。
          </p>
          <div className="flex flex-col md:flex-row gap-2">
            <Win95Input
              type="password"
              value={apiKey}
              onChange={setApiKey}
              placeholder="itchio_api_xxxxxxxxxxxx"
              className="flex-1"
            />
            <Win95Button
              variant="primary"
              onClick={handleSync}
              disabled={syncing}
            >
              {syncing ? "同步中..." : "同步 ITCH 游戏库"}
            </Win95Button>
          </div>

          {message && (
            <div
              className={`win95-inset p-2 text-sm font-mono ${
                message.includes("失败") || message.includes("错误")
                  ? "text-win95-red bg-win95-red/10"
                  : "text-win95-green bg-win95-green/10"
              }`}
            >
              {message}
            </div>
          )}

          <div className="text-xs text-win95-gray font-mono">
            API Key 获取方式: Itch.io 个人设置 → API Keys → Generate new API key
          </div>
        </div>
      </Win95Window>

      {/* Games List */}
      <Win95Window title="Games.db">
        {loading ? (
          <div className="text-center py-8 font-mono text-win95-gray">
            加载中...
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-8 font-mono text-win95-gray">
            [暂无游戏，请先同步]
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-win95-bg">
                  <th className="border-2 border-win95-gray p-2 text-left text-xs font-bold">
                    封面
                  </th>
                  <th className="border-2 border-win95-gray p-2 text-left text-xs font-bold">
                    标题
                  </th>
                  <th className="border-2 border-win95-gray p-2 text-left text-xs font-bold">
                    描述
                  </th>
                  <th className="border-2 border-win95-gray p-2 text-left text-xs font-bold">
                    状态
                  </th>
                  <th className="border-2 border-win95-gray p-2 text-left text-xs font-bold">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {games.map((game, index) => (
                  <tr
                    key={game._id}
                    className={index % 2 === 0 ? "bg-white" : "bg-[#E8E8E8]"}
                  >
                    <td className="border-2 border-win95-gray p-2">
                      <img
                        src={game.imageUrl}
                        alt={game.title}
                        className="w-16 h-12 object-cover win95-inset"
                      />
                    </td>
                    <td className="border-2 border-win95-gray p-2 text-sm font-bold">
                      <a
                        href={game.itchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-win95-blue hover:text-win95-red"
                      >
                        {game.title}
                      </a>
                    </td>
                    <td className="border-2 border-win95-gray p-2 text-xs max-w-xs truncate">
                      {game.description}
                    </td>
                    <td className="border-2 border-win95-gray p-2 text-xs">
                      {game.published ? (
                        <span className="text-win95-green font-bold">
                          已发布
                        </span>
                      ) : (
                        <span className="text-win95-gray">隐藏</span>
                      )}
                    </td>
                    <td className="border-2 border-win95-gray p-2">
                      <div className="flex gap-1 flex-wrap">
                        <Win95Button
                          className="text-xs px-2 py-1"
                          onClick={() => togglePublish(game._id, game.published)}
                        >
                          {game.published ? "隐藏" : "发布"}
                        </Win95Button>
                        <Win95Button
                          variant="danger"
                          className="text-xs px-2 py-1"
                          onClick={() => deleteGame(game._id)}
                        >
                          删除
                        </Win95Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Win95Window>
    </div>
  );
}
