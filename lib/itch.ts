export interface ItchGameDetails {
  title: string;
  description: string;
  imageUrl: string;
  itchUrl: string;
  tags: string[];
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(Number(num)));
}

function metaContent(html: string, key: string): string | null {
  const patterns = [
    new RegExp(
      `property=["']${key}["']\\s+content=["']([^"']+)["']`,
      "i"
    ),
    new RegExp(
      `content=["']([^"']+)["']\\s+property=["']${key}["']`,
      "i"
    ),
    new RegExp(`name=["']${key}["']\\s+content=["']([^"']+)["']`, "i"),
    new RegExp(`content=["']([^"']+)["']\\s+name=["']${key}["']`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtmlEntities(match[1].trim());
  }
  return null;
}

export function normalizeItchUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("请填写 Itch 游戏 URL");

  let url: URL;
  try {
    url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
  } catch {
    throw new Error("Itch URL 无效");
  }

  if (!url.hostname.endsWith("itch.io")) {
    throw new Error("请使用 itch.io 游戏页链接");
  }

  url.hash = "";
  url.search = "";
  return url.toString().replace(/\/$/, "");
}

export function parseItchHtml(html: string, itchUrl: string): ItchGameDetails {
  const productName = html.match(
    /"@type"\s*:\s*"Product"[\s\S]*?"name"\s*:\s*"([^"]+)"/
  )?.[1];
  const titleTag = html.match(/<title>([^<]+)<\/title>/i)?.[1];
  const twitterTitle = metaContent(html, "twitter:title");

  let title =
    productName ||
    twitterTitle ||
    titleTag ||
    metaContent(html, "og:title") ||
    "";
  title = decodeHtmlEntities(title).replace(/\s+by\s+.+$/i, "").trim();
  if (!title || title.toLowerCase() === "itch.io") {
    throw new Error("无法解析游戏标题");
  }

  const description =
    metaContent(html, "og:description") ||
    metaContent(html, "description") ||
    metaContent(html, "twitter:description") ||
    "—";

  const imageUrl =
    metaContent(html, "og:image") ||
    metaContent(html, "twitter:image") ||
    "";
  if (!imageUrl || imageUrl.includes("corsproxy")) {
    throw new Error("无法解析封面图");
  }

  const tags: string[] = [];
  const genreMatches = html.matchAll(
    /itch\.io\/games\/genre-([a-z0-9-]+)/gi
  );
  for (const match of genreMatches) {
    const tag = match[1].replace(/-/g, " ");
    if (tag && !tags.includes(tag)) tags.push(tag);
    if (tags.length >= 6) break;
  }

  return {
    title,
    description: description.trim() || "—",
    imageUrl,
    itchUrl,
    tags,
  };
}

/** Parse jina.ai reader markdown fallback */
export function parseItchJinaMarkdown(
  markdown: string,
  itchUrl: string
): ItchGameDetails {
  const titleLine = markdown.match(/^Title:\s*(.+)$/m)?.[1]?.trim() || "";
  const title = titleLine.replace(/\s+by\s+.+$/i, "").trim();
  if (!title) throw new Error("无法从预览解析标题");

  const image =
    markdown.match(/!\[[^\]]*\]\((https:\/\/img\.itch\.zone\/[^)]+)\)/)?.[1] ||
    markdown.match(/!\[[^\]]*\]\((https:\/\/[^)]+)\)/)?.[1] ||
    "";
  if (!image) throw new Error("无法从预览解析封面");

  // First meaningful paragraph after markdown header
  const body = markdown.split("Markdown Content:")[1] || markdown;
  const paragraphs = body
    .split(/\n\n+/)
    .map((p) =>
      p
        .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
        .replace(/\*\*/g, "")
        .replace(/^#+\s*/gm, "")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter((p) => p.length > 20 && !p.startsWith("http"));

  const description = paragraphs[0] || "—";

  return {
    title,
    description: description.slice(0, 500),
    imageUrl: image,
    itchUrl,
    tags: [],
  };
}

export async function fetchItchPageHtml(itchUrl: string): Promise<string> {
  const res = await fetch(itchUrl, {
    cache: "no-store",
    redirect: "follow",
    signal: AbortSignal.timeout(12000),
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; YuanWebsite/1.0; +https://yuanzzzz.com)",
      Accept: "text/html,application/xhtml+xml",
    },
  });
  if (!res.ok) throw new Error(`Itch 页面 HTTP ${res.status}`);
  return res.text();
}

export async function fetchItchGameDetails(
  rawUrl: string
): Promise<ItchGameDetails> {
  const itchUrl = normalizeItchUrl(rawUrl);
  const html = await fetchItchPageHtml(itchUrl);
  return parseItchHtml(html, itchUrl);
}
