import {
  buildSteamStoreUrl,
  parseSteamAppId,
  type SteamAppDetails,
} from "@/lib/steam";

interface SteamAppdetailsResponse {
  [appId: string]: {
    success: boolean;
    data?: {
      name?: string;
      short_description?: string;
      header_image?: string;
      genres?: { description?: string }[];
    };
  };
}

function detailsFromPayload(
  appId: number,
  payload: SteamAppdetailsResponse
): SteamAppDetails {
  const entry = payload[String(appId)];
  if (!entry?.success || !entry.data) {
    throw new Error(`未找到 AppID ${appId}`);
  }
  const data = entry.data;
  const title = data.name?.trim();
  if (!title) throw new Error("Steam 返回的游戏标题为空");
  const imageUrl =
    data.header_image?.trim() ||
    `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;

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

/** Resolve Steam metadata in the browser when the CN server is blocked. */
export async function resolveSteamDetailsInBrowser(
  rawInput: string
): Promise<SteamAppDetails> {
  const appId = parseSteamAppId(rawInput);
  if (!appId) throw new Error("请提供有效的 Steam AppID 或商店链接");

  const apiUrl = `https://store.steampowered.com/api/appdetails?appids=${appId}&l=schinese`;
  const errors: string[] = [];

  try {
    const res = await fetch(apiUrl);
    if (res.ok) {
      return detailsFromPayload(appId, (await res.json()) as SteamAppdetailsResponse);
    }
    errors.push(`direct HTTP ${res.status}`);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  try {
    const res = await fetch(`https://r.jina.ai/${apiUrl}`, {
      headers: { Accept: "text/plain" },
    });
    if (!res.ok) throw new Error(`预览服务 HTTP ${res.status}`);
    const text = await res.text();
    const jsonStart = text.indexOf("{");
    if (jsonStart < 0) throw new Error("预览未返回 JSON");
    const payload = JSON.parse(text.slice(jsonStart)) as SteamAppdetailsResponse;
    return detailsFromPayload(appId, payload);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  throw new Error(`无法获取 Steam 信息（${errors.join("；")}）`);
}
