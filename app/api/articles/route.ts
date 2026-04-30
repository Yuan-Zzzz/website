import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import Article from "@/models/Article";

// GET /api/articles - List all published articles
export async function GET() {
  try {
    await connectDB();
    const articles = await Article.find({ published: true })
      .sort({ date: -1 })
      .lean();
    return NextResponse.json({ success: true, data: articles });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}

// POST /api/articles - Create new article (admin only)
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

    const body = await request.json();
    await connectDB();

    // Generate slug if not provided
    if (!body.slug) {
      body.slug = body.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");
    }

    // Check for duplicate slug
    const existing = await Article.findOne({ slug: body.slug });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Slug already exists" },
        { status: 400 }
      );
    }

    const article = await Article.create(body);
    return NextResponse.json({ success: true, data: article }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create article" },
      { status: 500 }
    );
  }
}
