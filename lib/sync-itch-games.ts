import Game from "@/models/Game";

export interface ItchGame {
  id: number;
  title?: string;
  short_text?: string;
  description?: string;
  cover_url?: string;
  url?: string;
}

export function normalizeItchGame(itchGame: ItchGame) {
  const itchUrl = itchGame.url?.trim();
  if (!itchUrl) {
    return null;
  }

  const title = itchGame.title?.trim();
  if (!title) {
    return null;
  }

  return {
    title,
    description:
      (itchGame.short_text || itchGame.description || "").trim() || "—",
    imageUrl: itchGame.cover_url?.trim() || "/images/projects/default.png",
    itchUrl,
    tags: [] as string[],
    order: 0,
    published: true,
    updatedAt: new Date(),
  };
}

export async function syncItchGamesToDb(itchGames: ItchGame[]) {
  let synced = 0;
  let updated = 0;
  let skipped = 0;
  const failures: string[] = [];

  for (const itchGame of itchGames) {
    const gameData = normalizeItchGame(itchGame);
    if (!gameData) {
      skipped++;
      continue;
    }

    try {
      const existing = await Game.findOne({ itchUrl: gameData.itchUrl });
      if (existing) {
        await Game.updateOne({ itchUrl: gameData.itchUrl }, { $set: gameData });
        updated++;
      } else {
        await Game.create(gameData);
        synced++;
      }
    } catch (gameError) {
      const label = itchGame.title || itchGame.url || String(itchGame.id);
      const message =
        gameError instanceof Error ? gameError.message : "Unknown error";
      failures.push(`${label}: ${message}`);
      console.error(`Failed to sync game ${label}:`, gameError);
    }
  }

  return { synced, updated, skipped, failures, total: itchGames.length };
}

export function buildSyncMessage(result: {
  synced: number;
  updated: number;
  skipped: number;
  failures: string[];
}) {
  const parts = [`${result.synced} 个新增`, `${result.updated} 个更新`];
  if (result.skipped > 0) {
    parts.push(`${result.skipped} 个跳过（缺少标题或链接）`);
  }
  if (result.failures.length > 0) {
    parts.push(`${result.failures.length} 个失败`);
  }
  return `同步完成：${parts.join("，")}`;
}
