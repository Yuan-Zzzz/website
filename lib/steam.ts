export interface SteamAppDetails {
  steamAppId: number;
  title: string;
  description: string;
  imageUrl: string;
  steamUrl: string;
  tags: string[];
}

interface SteamAppdetailsResponse {
  [appId: string]: {
    success: boolean;
    data?: {
      name?: string;
      short_description?: string;
      header_image?: string;
      steam_appid?: number;
      genres?: { description?: string }[];
    };
  };
}

export function buildSteamStoreUrl(appId: number): string {
  return `https://store.steampowered.com/app/${appId}`;
}

export async function fetchSteamAppDetails(
  appId: number,
  lang = "schinese"
): Promise<SteamAppDetails> {
  if (!Number.isInteger(appId) || appId <= 0) {
    throw new Error("无效的 Steam AppID");
  }

  const url = `https://store.steampowered.com/api/appdetails?appids=${appId}&l=${lang}`;
  let res: Response;
  try {
    res = await fetch(url, { cache: "no-store" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network error";
    throw new Error(`无法访问 Steam Store API（${message}）`);
  }

  if (!res.ok) {
    throw new Error(`Steam Store API 错误: HTTP ${res.status}`);
  }

  const json = (await res.json()) as SteamAppdetailsResponse;
  const entry = json[String(appId)];
  if (!entry?.success || !entry.data) {
    throw new Error(`未找到 AppID ${appId}，或商店页不可用`);
  }

  const data = entry.data;
  const title = data.name?.trim();
  if (!title) {
    throw new Error("Steam 返回的游戏标题为空");
  }

  const imageUrl = data.header_image?.trim();
  if (!imageUrl) {
    throw new Error("Steam 返回的封面图为空");
  }

  return {
    steamAppId: appId,
    title,
    description: (data.short_description || "").trim() || "—",
    imageUrl,
    steamUrl: buildSteamStoreUrl(appId),
    tags: (data.genres || [])
      .map((g) => g.description?.trim())
      .filter((tag): tag is string => Boolean(tag)),
  };
}
