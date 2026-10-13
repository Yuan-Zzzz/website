import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import {
  fetchItchGameDetails,
  normalizeItchUrl,
  type ItchGameDetails,
} from "@/lib/itch";
import Game from "@/models/Game";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get("admin-token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

async function upsertItchGame(
  details: ItchGameDetails,
  extras: { order?: number; published?: boolean }
) {
  await connectDB();
  const existing = await Game.findOne({ itchUrl: details.itchUrl });
  const updates = {
    title: details.title,
    description: details.description,
    imageUrl: details.imageUrl,
    itchUrl: details.itchUrl,
    tags: details.tags,
    featured: false,
    order: extras.order !== undefined ? extras.order : existing?.order ?? 0,
    published: extras.published === undefined ? true : extras.published,
    updatedAt: new Date(),
  };

  if (existing) {
    Object.assign(existing, updates);
    await existing.save();
    return { game: existing, created: false };
  }

  const game = await Game.create(updates);
  return { game, created: true };
}

// POST /api/games/itch — create from itch URL (server fetch) or pre-parsed details
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
    const order = Number(body.order) || 0;

    let details: ItchGameDetails;

    if (body.title && body.imageUrl && body.itchUrl) {
      details = {
        title: String(body.title).trim(),
        description: String(body.description || "—").trim() || "—",
        imageUrl: String(body.imageUrl).trim(),
        itchUrl: normalizeItchUrl(String(body.itchUrl)),
        tags: Array.isArray(body.tags)
          ? body.tags.map((t: unknown) => String(t).trim()).filter(Boolean)
          : [],
      };
    } else if (body.itchUrl) {
      try {
        details = await fetchItchGameDetails(String(body.itchUrl));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json(
          {
            success: false,
            error: message,
            needClientFetch: true,
          },
          { status: 502 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: "请提供 itchUrl" },
        { status: 400 }
      );
    }

    const { game, created } = await upsertItchGame(details, {
      order,
      published: body.published === undefined ? true : Boolean(body.published),
    });

    return NextResponse.json(
      { success: true, data: game, created },
      { status: created ? 201 : 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to add itch game";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
