import { readFile } from "node:fs/promises";
import path from "node:path";
export const runtime = "nodejs";
export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const match = /^([a-f0-9]{64})\.(png|jpg|gif|webp)$/.exec(name);
  if (!match) return new Response(null, { status: 404 });
  try {
    const bytes = await readFile(path.join(process.env.OBSIDIAN_ASSET_DIR || path.join(process.cwd(), "uploads", "obsidian"), name));
    return new Response(new Uint8Array(bytes), { headers: { "Content-Type": `image/${match[2] === "jpg" ? "jpeg" : match[2]}`, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" } });
  } catch { return new Response(null, { status: 404 }); }
}
