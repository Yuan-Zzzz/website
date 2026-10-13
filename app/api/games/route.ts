import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import Game from "@/models/Game";

async function isAdmin(request: NextRequest) {
  const token = request.cookies.get("admin-token")?.value;
  if (!token) return false;
  const payload = await verifyToken(token);
  return Boolean(payload);
}

// GET /api/games — published for public; all games for admin
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const admin = await isAdmin(request);
    const filter = admin ? {} : { published: true };
    const games = await Game.find(filter).sort({ order: 1, createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: games });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch games" },
      { status: 500 }
    );
  }
}

// POST /api/games — create game manually (Itch / custom)
export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();
    const imageUrl = String(body.imageUrl || "").trim();
    const itchUrl = String(body.itchUrl || "").trim();
    const steamUrl = String(body.steamUrl || "").trim();
    const steamAppIdRaw = body.steamAppId;
    const steamAppId =
      steamAppIdRaw === "" || steamAppIdRaw === undefined || steamAppIdRaw === null
        ? undefined
        : Number(steamAppIdRaw);

    if (!title || !description || !imageUrl) {
      return NextResponse.json(
        { success: false, error: "标题、简介、封面必填" },
        { status: 400 }
      );
    }

    const hasSteam =
      typeof steamAppId === "number" && Number.isInteger(steamAppId) && steamAppId > 0;
    if (!hasSteam && !itchUrl) {
      return NextResponse.json(
        { success: false, error: "需要填写 itchUrl 或 steamAppId" },
        { status: 400 }
      );
    }

    await connectDB();

    const game = await Game.create({
      title,
      description,
      imageUrl,
      itchUrl,
      steamAppId: hasSteam ? steamAppId : undefined,
      steamUrl: steamUrl || (hasSteam ? `https://store.steampowered.com/app/${steamAppId}` : ""),
      featured: Boolean(body.featured),
      tags: Array.isArray(body.tags)
        ? body.tags.map((t: unknown) => String(t).trim()).filter(Boolean)
        : String(body.tags || "")
            .split(",")
            .map((t: string) => t.trim())
            .filter(Boolean),
      order: Number(body.order) || 0,
      published: body.published === undefined ? true : Boolean(body.published),
    });

    return NextResponse.json({ success: true, data: game }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create game";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
