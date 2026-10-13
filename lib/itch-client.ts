import {
  normalizeItchUrl,
  parseItchHtml,
  parseItchJinaMarkdown,
  type ItchGameDetails,
} from "@/lib/itch";

async function fetchViaJina(itchUrl: string): Promise<ItchGameDetails> {
  const res = await fetch(`https://r.jina.ai/${itchUrl}`, {
    headers: { Accept: "text/plain" },
  });
  if (!res.ok) throw new Error(`预览服务 HTTP ${res.status}`);
  const markdown = await res.text();
  return parseItchJinaMarkdown(markdown, itchUrl);
}

async function fetchViaDirect(itchUrl: string): Promise<ItchGameDetails> {
  const res = await fetch(itchUrl);
  if (!res.ok) throw new Error(`Itch HTTP ${res.status}`);
  const html = await res.text();
  return parseItchHtml(html, itchUrl);
}

/** Resolve itch metadata in the browser (works when server is blocked). */
export async function resolveItchDetailsInBrowser(
  rawUrl: string
): Promise<ItchGameDetails> {
  const itchUrl = normalizeItchUrl(rawUrl);
  const errors: string[] = [];

  try {
    return await fetchViaDirect(itchUrl);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  try {
    return await fetchViaJina(itchUrl);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  throw new Error(`无法解析 Itch 页面（${errors.join("；")}）`);
}
