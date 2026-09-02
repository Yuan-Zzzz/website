import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getUserFromRequest } from "@/lib/user-auth";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    const session = await getUserFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: true, data: null });
    }

    await connectDB();
    const user = await User.findById(session.userId).lean();
    if (!user) {
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user._id.toString(),
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}
