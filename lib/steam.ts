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

const STEAM_ENDPOINTS = [
  "https://store.steamchina.com/api/appdetails",
  "https://store.steampowered.com/api/appdetails",
];

export function buildSteamStoreUrl(appId: number): string {
  return `https://store.steampowered.com/app/${appId}`;
}

export function parseSteamAppId(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (/^\d+$/.test(trimmed)) {
    const id = Number(trimmed);
    return Number.isInteger(id) && id > 0 ? id : null;
  }

  const match = trimmed.match(/store\.steampowered\.com\/app\/(\d+)/i)
    || trimmed.match(/steamchina\.com\/app\/(\d+)/i)
    || trimmed.match(/[?&]appid=(\d+)/i);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function fetchFromEndpoint(
  endpoint: string,
  appId: number,
  lang: string
): Promise<SteamAppDetails> {
  const url = `${endpoint}?appids=${appId}&l=${lang}`;
  const res = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    throw new Error(`Steam API HTTP ${res.status}`);
  }

  const json = (await res.json()) as SteamAppdetailsResponse;
  const entry = json[String(appId)];
  if (!entry?.success || !entry.data) {
    throw new Error(`未找到 AppID ${appId}`);
  }

  const data = entry.data;
  const title = data.name?.trim();
  if (!title) throw new Error("Steam 返回的游戏标题为空");

  const imageUrl = data.header_image?.trim();
  if (!imageUrl) throw new Error("Steam 返回的封面图为空");

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

export async function fetchSteamAppDetails(
  appId: number,
  lang = "schinese"
): Promise<SteamAppDetails> {
  if (!Number.isInteger(appId) || appId <= 0) {
    throw new Error("无效的 Steam AppID");
  }

  const errors: string[] = [];
  for (const endpoint of STEAM_ENDPOINTS) {
    try {
      return await fetchFromEndpoint(endpoint, appId, lang);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${endpoint}: ${message}`);
    }
  }

  throw new Error(`无法获取 Steam 信息（${errors.join(" | ")}）`);
}
