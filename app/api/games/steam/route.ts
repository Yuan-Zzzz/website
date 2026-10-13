import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import {
  buildSteamStoreUrl,
  fetchSteamAppDetails,
  parseSteamAppId,
  type SteamAppDetails,
} from "@/lib/steam";
import Game from "@/models/Game";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get("admin-token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

async function upsertSteamGame(
  details: SteamAppDetails,
  extras: {
    featured?: boolean;
    order?: number;
    published?: boolean;
  }
) {
  await connectDB();
  const existing = await Game.findOne({ steamAppId: details.steamAppId });
  const updates = {
    title: details.title,
    description: details.description,
    imageUrl: details.imageUrl,
    steamAppId: details.steamAppId,
    steamUrl: details.steamUrl || buildSteamStoreUrl(details.steamAppId),
    tags: details.tags,
    featured: extras.featured === undefined ? true : Boolean(extras.featured),
    order:
      extras.order !== undefined
        ? Number(extras.order) || 0
        : existing?.order ?? 0,
    published:
      extras.published === undefined ? true : Boolean(extras.published),
    updatedAt: new Date(),
  };

  if (existing) {
    Object.assign(existing, updates);
    await existing.save();
    return { game: existing, created: false };
  }

  const game = await Game.create({
    ...updates,
    itchUrl: "",
  });
  return { game, created: true };
}

// POST /api/games/steam — create/refresh from AppID or pre-parsed details
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
    const extras = {
      featured: body.featured,
      order: body.order,
      published: body.published,
    };

    let details: SteamAppDetails;

    if (body.title && body.imageUrl && (body.steamAppId || body.steamUrl)) {
      const steamAppId =
        parseSteamAppId(String(body.steamAppId ?? body.steamUrl ?? "")) ??
        Number(body.steamAppId);
      if (!Number.isInteger(steamAppId) || steamAppId <= 0) {
        return NextResponse.json(
          { success: false, error: "请提供有效的 Steam AppID" },
          { status: 400 }
        );
      }
      details = {
        steamAppId,
        title: String(body.title).trim(),
        description: String(body.description || "—").trim() || "—",
        imageUrl: String(body.imageUrl).trim(),
        steamUrl: String(body.steamUrl || buildSteamStoreUrl(steamAppId)),
        tags: Array.isArray(body.tags)
          ? body.tags.map((t: unknown) => String(t).trim()).filter(Boolean)
          : [],
      };
    } else {
      const steamAppId =
        parseSteamAppId(String(body.steamAppId ?? body.steamUrl ?? "")) ??
        Number(body.steamAppId);
      if (!Number.isInteger(steamAppId) || steamAppId <= 0) {
        return NextResponse.json(
          { success: false, error: "请提供有效的 Steam AppID 或商店链接" },
          { status: 400 }
        );
      }

      try {
        details = await fetchSteamAppDetails(steamAppId);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json(
          { success: false, error: message, needClientFetch: true },
          { status: 502 }
        );
      }
    }

    const { game, created } = await upsertSteamGame(details, extras);
    return NextResponse.json(
      { success: true, data: game, created },
      { status: created ? 201 : 200 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to sync Steam game";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
