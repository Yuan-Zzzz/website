import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Article from "@/models/Article";
import { parseSyncBody, readSyncRequest, SyncError, syncAuthorized, syncVersion } from "@/lib/obsidian-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function auth(request: NextRequest) {
  if (!process.env.OBSIDIAN_SYNC_TOKEN_HASH) throw new SyncError(503, "同步功能尚未配置");
  if (!syncAuthorized(request.headers.get("authorization"))) throw new SyncError(401, "同步凭证无效");
}
function result(a: { _id: unknown; title: string; slug: string; published: boolean; date?: Date; obsidianKey?: string; updatedAt?: Date; obsidianRevision?: number }) {
  return { id: String(a._id), title: a.title, slug: a.slug, date: a.date, published: a.published, key: a.obsidianKey, version: syncVersion(a) };
}
function failure(e: unknown) {
  if (e instanceof SyncError) return NextResponse.json({ success: false, error: e.message }, { status: e.status });
  if (typeof e === "object" && e && "code" in e && e.code === 11000) return NextResponse.json({ success: false, error: "笔记或网址已被使用，请重新同步或绑定已有文章" }, { status: 409 });
  console.error("Obsidian sync failed", e instanceof Error ? e.name : "unknown");
  return NextResponse.json({ success: false, error: "同步失败，请稍后重试" }, { status: 500 });
}
export async function GET(request: NextRequest) {
  try {
    auth(request); await connectDB();
    const articles = await Article.find({}).select("title slug date published obsidianKey updatedAt obsidianRevision");
    return NextResponse.json({ success: true, data: articles.map(result) }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) { return failure(e); }
}
export async function POST(request: NextRequest) {
  try {
    auth(request);
    let json;
    try { json = JSON.parse((await readSyncRequest(request, 4000000)).toString("utf8")); }
    catch (e) { if (e instanceof SyncError) throw e; throw new SyncError(400, "无效 JSON"); }
    const body = parseSyncBody(json); await connectDB(); await Article.init();
    const existing = body.id ? await Article.findById(body.id) : await Article.findOne({ obsidianKey: body.key });
    if (existing) {
      if (body.operation !== "bind" && existing.obsidianKey !== body.key) throw new SyncError(409, "请先绑定已有文章");
      if (existing.obsidianKey && existing.obsidianKey !== body.key) throw new SyncError(409, "此文章已绑定其他笔记");
      if (body.version !== syncVersion(existing)) {
        // A lost response can be retried safely, but cannot overwrite a different edit.
        const a = body.article;
        const same = a && existing.obsidianKey === body.key && existing.published === true
          && existing.title === a.title && existing.content === a.content && existing.excerpt === a.excerpt
          && new Date(existing.date).getTime() === a.date.getTime()
          && JSON.stringify([...existing.tags]) === JSON.stringify(a.tags)
          && JSON.stringify([...existing.categories]) === JSON.stringify(a.categories);
        if (same || (body.operation === "unpublish" && existing.obsidianKey === body.key && !existing.published)) return NextResponse.json({ success: true, data: result(existing) });
        throw new SyncError(409, "网站文章已改变，请检查后重新绑定；未覆盖网站内容");
      }
      const update = body.operation === "bind" ? { obsidianKey: body.key }
        : body.operation === "unpublish" ? { published: false }
        : { ...body.article, slug: existing.slug, obsidianKey: body.key };
      const changed = await Article.findOneAndUpdate({ _id: existing._id, updatedAt: existing.updatedAt,
        $or: [{ obsidianRevision: existing.obsidianRevision || 0 }, ...(existing.obsidianRevision ? [] : [{ obsidianRevision: { $exists: false } }])] },
        { $set: { ...update, updatedAt: new Date() }, $inc: { obsidianRevision: 1 } }, { new: true, runValidators: true });
      if (!changed) throw new SyncError(409, "文章被同时修改，请重新检查");
      return NextResponse.json({ success: true, data: result(changed) });
    }
    if (body.id) throw new SyncError(404, "绑定的文章已不存在；未创建重复文章");
    if (body.operation !== "publish") throw new SyncError(404, "笔记尚未发布");
    // Never silently duplicate an existing article on the first publication.
    if (await Article.exists({ $or: [{ slug: body.article!.slug }, { title: body.article!.title }] })) throw new SyncError(409, "存在同名或同网址文章，请先使用绑定命令");
    const created = await Article.create({ ...body.article, obsidianKey: body.key, obsidianRevision: 1, updatedAt: new Date() });
    return NextResponse.json({ success: true, data: result(created) }, { status: 201 });
  } catch (e) { return failure(e); }
}
