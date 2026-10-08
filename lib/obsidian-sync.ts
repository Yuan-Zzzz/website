import { createHash, timingSafeEqual } from "node:crypto";

export function syncAuthorized(header: string | null, expected = process.env.OBSIDIAN_SYNC_TOKEN_HASH): boolean {
  if (!expected || !/^[a-f0-9]{64}$/.test(expected) || !header?.startsWith("Bearer ")) return false;
  const actual = createHash("sha256").update(header.slice(7)).digest();
  return timingSafeEqual(actual, Buffer.from(expected, "hex"));
}

export class SyncError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function parseSyncBody(value: unknown) {
  if (!value || typeof value !== "object") throw new SyncError(400, "请求格式错误");
  const b = value as Record<string, unknown>;
  if (typeof b.key !== "string" || !/^[a-f0-9-]{36}$/.test(b.key)) throw new SyncError(400, "无效的笔记标识");
  if (!["publish", "unpublish", "bind"].includes(String(b.operation))) throw new SyncError(400, "无效操作");
  if (b.id !== undefined && (typeof b.id !== "string" || !/^[a-f0-9]{24}$/.test(b.id))) throw new SyncError(400, "无效文章 ID");
  if (b.id && typeof b.version !== "string") throw new SyncError(400, "缺少同步版本");
  const operation = b.operation as "publish" | "unpublish" | "bind";
  if (operation !== "publish") return { key: b.key, id: b.id as string | undefined, version: b.version as string | undefined, operation, article: undefined };
  const text = (name: string, max: number, required = false) => {
    const v = b[name];
    if (typeof v !== "string" || v.length > max || (required && !v.trim())) throw new SyncError(400, `无效字段：${name}`);
    return v;
  };
  const list = (name: string) => {
    const v = b[name] ?? [];
    if (!Array.isArray(v) || v.length > 50 || v.some(x => typeof x !== "string" || x.length > 100)) throw new SyncError(400, `无效字段：${name}`);
    return v as string[];
  };
  const slug = text("slug", 160, true);
  if (!/^[\p{L}\p{N}_-]+$/u.test(slug)) throw new SyncError(400, "网址只能使用文字、数字、下划线或连字符");
  const date = new Date(String(b.date));
  if (!Number.isFinite(date.getTime())) throw new SyncError(400, "无效日期");
  return { key: b.key, id: b.id as string | undefined, version: b.version as string | undefined, operation,
    article: { title: text("title", 300, true), slug, excerpt: text("excerpt", 2000, true), content: text("content", 1500000, true), obsidianRaw: text("raw", 1500000), date, tags: list("tags"), categories: list("categories"), published: true } };
}

export function syncVersion(article: { updatedAt?: Date | string; obsidianRevision?: number }) {
  return `${new Date(article.updatedAt || 0).toISOString()}:${article.obsidianRevision || 0}`;
}

export async function readSyncRequest(request: Request, limit: number): Promise<Buffer> {
  if (Number(request.headers.get("content-length")) > limit) throw new SyncError(413, "上传内容过大");
  if (!request.body) return Buffer.alloc(0);
  const reader = request.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new SyncError(413, "上传内容过大"); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks);
}
