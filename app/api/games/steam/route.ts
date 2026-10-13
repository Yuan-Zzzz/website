import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { fetchSteamAppDetails } from "@/lib/steam";
import Game from "@/models/Game";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get("admin-token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

// POST /api/games/steam — create or refresh a game from Steam AppID
export async function POST(request: NextRequest) {
  try {
    const payload = await requireAdmin(request);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const steamAppId = Number(body.steamAppId);
    if (!Number.isInteger(steamAppId) || steamAppId <= 0) {
      return NextResponse.json(
        { success: false, error: "请提供有效的 Steam AppID" },
        { status: 400 }
      );
    }

    const details = await fetchSteamAppDetails(steamAppId);
    await connectDB();

    const existing = await Game.findOne({ steamAppId });
    const updates = {
      title: details.title,
      description: details.description,
      imageUrl: details.imageUrl,
      steamAppId: details.steamAppId,
      steamUrl: details.steamUrl,
      tags: details.tags,
      featured: body.featured === undefined ? true : Boolean(body.featured),
      order: body.order !== undefined ? Number(body.order) || 0 : existing?.order ?? 0,
      published: body.published === undefined ? true : Boolean(body.published),
      updatedAt: new Date(),
    };

    if (existing) {
      Object.assign(existing, updates);
      await existing.save();
      return NextResponse.json({ success: true, data: existing, created: false });
    }

    const game = await Game.create({
      ...updates,
      itchUrl: "",
    });
    return NextResponse.json(
      { success: true, data: game, created: true },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to sync Steam game";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
