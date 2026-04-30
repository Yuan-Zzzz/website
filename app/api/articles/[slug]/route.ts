import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import Article from "@/models/Article";

interface Params {
  params: Promise<{ slug: string }>;
}

// GET /api/articles/:slug - Get single article
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { slug: rawSlug } = await params;
    const slug = decodeURIComponent(rawSlug);
    await connectDB();
    let article = await Article.findOne({ slug, published: true }).lean();
    if (!article && slug !== rawSlug) {
      article = await Article.findOne({ slug: rawSlug, published: true }).lean();
    }

    if (!article) {
      return NextResponse.json(
        { success: false, error: "Article not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: article });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch article" },
      { status: 500 }
    );
  }
}

// PUT /api/articles/:slug - Update article (admin only)
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

    const { slug: rawSlug } = await params;
    const slug = decodeURIComponent(rawSlug);
    const body = await request.json();
    await connectDB();

    const article = await Article.findOneAndUpdate(
      { slug: body.slug || slug },
      { ...body, updatedAt: new Date() },
      { new: true }
    );

    if (!article) {
      return NextResponse.json(
        { success: false, error: "Article not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: article });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update article" },
      { status: 500 }
    );
  }
}

// DELETE /api/articles/:slug - Delete article (admin only)
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

    const { slug: rawSlug } = await params;
    const slug = decodeURIComponent(rawSlug);
    await connectDB();

    const article = await Article.findOneAndDelete({ slug });

    if (!article) {
      return NextResponse.json(
        { success: false, error: "Article not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Article deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete article" },
      { status: 500 }
    );
  }
}
