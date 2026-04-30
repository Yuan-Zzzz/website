import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import Game from "@/models/Game";

// GET /api/games - List all published games
export async function GET() {
  try {
    await connectDB();
    const games = await Game.find({ published: true })
      .sort({ order: 1 })
      .lean();
    return NextResponse.json({ success: true, data: games });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch games" },
      { status: 500 }
    );
  }
}

// POST /api/games - Create new game (admin only)
export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    await connectDB();

    const game = await Game.create(body);
    return NextResponse.json({ success: true, data: game }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create game" },
      { status: 500 }
    );
  }
}
