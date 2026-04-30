import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import Game from "@/models/Game";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/games/:id - Get single game
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await connectDB();
    const game = await Game.findById(id).lean();

    if (!game) {
      return NextResponse.json(
        { success: false, error: "Game not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: game });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch game" },
      { status: 500 }
    );
  }
}

// PUT /api/games/:id - Update game (admin only)
export async function PUT(request: NextRequest, { params }: Params) {
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

    const { id } = await params;
    const body = await request.json();
    await connectDB();

    const game = await Game.findByIdAndUpdate(
      id,
      { ...body, updatedAt: new Date() },
      { new: true }
    );

    if (!game) {
      return NextResponse.json(
        { success: false, error: "Game not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: game });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update game" },
      { status: 500 }
    );
  }
}

// DELETE /api/games/:id - Delete game (admin only)
export async function DELETE(request: NextRequest, { params }: Params) {
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

    const { id } = await params;
    await connectDB();

    const game = await Game.findByIdAndDelete(id);

    if (!game) {
      return NextResponse.json(
        { success: false, error: "Game not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Game deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete game" },
      { status: 500 }
    );
  }
}
