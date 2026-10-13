"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Win95Window from "@/components/win95/Win95Window";
import Win95Button from "@/components/win95/Win95Button";
import Win95Input from "@/components/win95/Win95Input";
import Win95Textarea from "@/components/win95/Win95Textarea";

interface Game {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  itchUrl?: string;
  steamAppId?: number;
  steamUrl?: string;
  featured?: boolean;
  published: boolean;
  tags: string[];
  order: number;
}

function storeHref(game: Game) {
  return game.steamUrl || game.itchUrl || "#";
}

export default function AdminGamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [steamAppId, setSteamAppId] = useState("");
  const [steamFeatured, setSteamFeatured] = useState(true);
  const [steamOrder, setSteamOrder] = useState("0");
  const [itchTitle, setItchTitle] = useState("");
  const [itchDescription, setItchDescription] = useState("");
  const [itchImageUrl, setItchImageUrl] = useState("");
  const [itchUrl, setItchUrl] = useState("");
  const [itchOrder, setItchOrder] = useState("0");
  const router = useRouter();

  useEffect(() => {
    fetchGames();
  }, []);

  async function fetchGames() {
    try {
      setLoading(true);
      const res = await fetch("/api/games");
      const data = await res.json();
      if (data.success) setGames(data.data);
    } catch {
      setMessage("加载失败");
    } finally {
      setLoading(false);
    }
  }

  async function addSteamGame() {
    const id = Number(steamAppId.trim());
    if (!Number.isInteger(id) || id <= 0) {
      setMessage("AppID 无效");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/games/steam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          steamAppId: id,
          featured: steamFeatured,
          order: Number(steamOrder) || 0,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setMessage(data.error || "添加失败");
        return;
      }
      setSteamAppId("");
      setMessage(data.created ? "已添加" : "已更新");
      await fetchGames();
      router.refresh();
    } catch {
      setMessage("网络错误");
    } finally {
      setSaving(false);
    }
  }

  async function addItchGame() {
    if (!itchTitle.trim() || !itchDescription.trim() || !itchImageUrl.trim() || !itchUrl.trim()) {
      setMessage("请填完 Itch 表单");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: itchTitle.trim(),
          description: itchDescription.trim(),
          imageUrl: itchImageUrl.trim(),
          itchUrl: itchUrl.trim(),
          featured: false,
          order: Number(itchOrder) || 0,
          published: true,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setMessage(data.error || "添加失败");
        return;
      }
      setItchTitle("");
      setItchDescription("");
      setItchImageUrl("");
      setItchUrl("");
      setItchOrder("0");
      setMessage("已添加");
      await fetchGames();
      router.refresh();
    } catch {
      setMessage("网络错误");
    } finally {
      setSaving(false);
    }
  }

  async function deleteGame(id: string) {
    if (!confirm("删除此游戏？")) return;
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

  async function patchGame(id: string, patch: Partial<Game>) {
    try {
      const res = await fetch(`/api/games/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (data.success) {
        setGames(games.map((g) => (g._id === id ? { ...g, ...data.data } : g)));
        router.refresh();
      } else {
        alert(data.error || "更新失败");
      }
    } catch {
      alert("操作失败");
    }
  }

  async function refreshSteam(game: Game) {
    if (!game.steamAppId) return;
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/games/steam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          steamAppId: game.steamAppId,
          featured: game.featured,
          order: game.order,
          published: game.published,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setMessage(data.error || "刷新失败");
        return;
      }
      setMessage("已刷新");
      await fetchGames();
      router.refresh();
    } catch {
      setMessage("网络错误");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-black">游戏管理</h1>
        <Link href="/admin" className="no-underline">
          <Win95Button>← 返回</Win95Button>
        </Link>
      </div>

      {message && (
        <div
          className={`win95-inset p-2 text-sm font-mono ${
            message.includes("失败") || message.includes("无效") || message.includes("请填")
              ? "text-win95-red"
              : "text-win95-green"
          }`}
        >
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Win95Window title="Steam.exe">
          <div className="space-y-3">
            <div className="flex gap-2">
              <Win95Input
                value={steamAppId}
                onChange={setSteamAppId}
                placeholder="AppID"
                className="flex-1"
              />
              <Win95Input
                type="number"
                value={steamOrder}
                onChange={setSteamOrder}
                placeholder="排序"
                className="w-20"
              />
            </div>
            <label className="flex items-center gap-2 text-sm font-mono">
              <input
                type="checkbox"
                checked={steamFeatured}
                onChange={(e) => setSteamFeatured(e.target.checked)}
              />
              主推首页
            </label>
            <Win95Button variant="primary" onClick={addSteamGame} disabled={saving}>
              {saving ? "…" : "添加 / 更新"}
            </Win95Button>
          </div>
        </Win95Window>

        <Win95Window title="Itch.exe">
          <div className="space-y-2">
            <Win95Input value={itchTitle} onChange={setItchTitle} placeholder="标题" />
            <Win95Textarea
              value={itchDescription}
              onChange={setItchDescription}
              placeholder="简介"
              rows={2}
            />
            <Win95Input value={itchImageUrl} onChange={setItchImageUrl} placeholder="封面 URL" />
            <Win95Input value={itchUrl} onChange={setItchUrl} placeholder="Itch URL" type="url" />
            <div className="flex gap-2">
              <Win95Input
                type="number"
                value={itchOrder}
                onChange={setItchOrder}
                placeholder="排序"
                className="w-20"
              />
              <Win95Button variant="primary" onClick={addItchGame} disabled={saving}>
                {saving ? "…" : "添加"}
              </Win95Button>
            </div>
          </div>
        </Win95Window>
      </div>

      <Win95Window title="Games.db">
        {loading ? (
          <div className="text-center py-8 font-mono text-win95-gray">加载中...</div>
        ) : games.length === 0 ? (
          <div className="text-center py-8 font-mono text-win95-gray">[暂无游戏]</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-win95-bg">
                  <th className="border-2 border-win95-gray p-2 text-left text-xs font-bold">封面</th>
                  <th className="border-2 border-win95-gray p-2 text-left text-xs font-bold">标题</th>
                  <th className="border-2 border-win95-gray p-2 text-left text-xs font-bold">平台</th>
                  <th className="border-2 border-win95-gray p-2 text-left text-xs font-bold">状态</th>
                  <th className="border-2 border-win95-gray p-2 text-left text-xs font-bold">操作</th>
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
                        href={storeHref(game)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-win95-blue hover:text-win95-red"
                      >
                        {game.title}
                      </a>
                      <div className="text-xs font-mono text-win95-gray font-normal mt-1">
                        order: {game.order}
                        {game.featured ? " · 主推" : ""}
                      </div>
                    </td>
                    <td className="border-2 border-win95-gray p-2 text-xs font-mono">
                      {game.steamAppId ? `Steam ${game.steamAppId}` : "Itch"}
                    </td>
                    <td className="border-2 border-win95-gray p-2 text-xs">
                      {game.published ? (
                        <span className="text-win95-green font-bold">已发布</span>
                      ) : (
                        <span className="text-win95-gray">隐藏</span>
                      )}
                    </td>
                    <td className="border-2 border-win95-gray p-2">
                      <div className="flex gap-1 flex-wrap">
                        <Win95Button
                          className="text-xs px-2 py-1"
                          onClick={() =>
                            patchGame(game._id, { published: !game.published })
                          }
                        >
                          {game.published ? "隐藏" : "发布"}
                        </Win95Button>
                        {game.steamAppId && (
                          <Win95Button
                            className="text-xs px-2 py-1"
                            onClick={() =>
                              patchGame(game._id, { featured: !game.featured })
                            }
                          >
                            {game.featured ? "取消主推" : "主推"}
                          </Win95Button>
                        )}
                        {game.steamAppId && (
                          <Win95Button
                            className="text-xs px-2 py-1"
                            onClick={() => refreshSteam(game)}
                            disabled={saving}
                          >
                            刷新
                          </Win95Button>
                        )}
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
