import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import Game from "@/models/Game";

interface ItchGame {
  id: number;
  title: string;
  short_text?: string;
  description?: string;
  cover_url?: string;
  url: string;
}

export async function POST(request: NextRequest) {
  try {
    // Verify auth
    const token = request.cookies.get("admin-token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    const { apiKey } = await request.json();
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "API Key is required" },
        { status: 400 }
      );
    }

    // Call Itch.io API
    const res = await fetch(
      `https://itch.io/api/1/${apiKey}/my-games`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { success: false, error: `Itch.io API error: ${res.status} ${text}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const itchGames: ItchGame[] = data.games || [];

    if (itchGames.length === 0) {
      return NextResponse.json(
        { success: true, message: "No games found in your Itch.io library", synced: 0 },
        { status: 200 }
      );
    }

    await connectDB();

    let synced = 0;
    let updated = 0;

    for (const itchGame of itchGames) {
      const gameData = {
        title: itchGame.title,
        description: itchGame.short_text || itchGame.description || "",
        imageUrl: itchGame.cover_url || "/images/projects/default.png",
        itchUrl: itchGame.url,
        tags: [],
        order: 0,
        published: true,
        updatedAt: new Date(),
      };

      const existing = await Game.findOne({ itchUrl: itchGame.url });
      if (existing) {
        await Game.updateOne({ itchUrl: itchGame.url }, gameData);
        updated++;
      } else {
        await Game.create(gameData);
        synced++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sync completed: ${synced} new games added, ${updated} existing games updated`,
      synced,
      updated,
      total: itchGames.length,
    });
  } catch (error: any) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Sync failed" },
      { status: 500 }
    );
  }
}
