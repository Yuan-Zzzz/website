import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { readSyncRequest, SyncError, syncAuthorized } from "@/lib/obsidian-sync";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  if (!syncAuthorized(request.headers.get("authorization"))) return NextResponse.json({ success: false, error: "同步凭证无效" }, { status: 401 });
  let bytes: Buffer;
  try { bytes = await readSyncRequest(request, 10000000); }
  catch (e) { return NextResponse.json({ success: false, error: "图片上传失败或超过 10MB" }, { status: e instanceof SyncError ? e.status : 400 }); }
  if (bytes.length > 10000000 || !bytes.length) return NextResponse.json({ success: false, error: "图片必须小于 10MB" }, { status: 413 });
  // Determine type from bytes; do not accept executable HTML/SVG or user-supplied paths.
  const ext = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? "png"
    : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 ? "jpg"
    : /^GIF8[79]a$/.test(bytes.subarray(0,6).toString()) ? "gif"
    : bytes.subarray(0,4).toString() === "RIFF" && bytes.subarray(8,12).toString() === "WEBP" ? "webp" : null;
  if (!ext) return NextResponse.json({ success: false, error: "仅支持 PNG、JPEG、GIF、WebP 图片" }, { status: 415 });
  const name = `${createHash("sha256").update(bytes).digest("hex")}.${ext}`;
  const dir = process.env.OBSIDIAN_ASSET_DIR || path.join(process.cwd(), "uploads", "obsidian");
  await mkdir(dir, { recursive: true }); await writeFile(path.join(dir, name), bytes, { flag: "w" });
  return NextResponse.json({ success: true, data: { url: `/api/obsidian/assets/${name}` } });
}
