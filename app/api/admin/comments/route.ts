import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { isAdminRequest } from "@/lib/user-auth";
import Comment from "@/models/Comment";
import Article from "@/models/Article";

export async function GET(request: NextRequest) {
  try {
    if (!(await isAdminRequest(request))) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();
    const comments = await Comment.find()
      .sort({ createdAt: -1 })
      .populate("userId", "username displayName avatarUrl")
      .lean();

    const slugs = [...new Set(comments.map((c) => c.articleSlug))];
    const articles = await Article.find({ slug: { $in: slugs } })
      .select("slug title")
      .lean();
    const titleBySlug = Object.fromEntries(
      articles.map((a) => [a.slug, a.title])
    );

    const data = comments.map((comment) => {
      const user = comment.userId as {
        _id: unknown;
        username: string;
        displayName: string;
        avatarUrl: string;
      } | null;

      return {
        _id: comment._id.toString(),
        articleSlug: comment.articleSlug,
        articleTitle: titleBySlug[comment.articleSlug] || comment.articleSlug,
        content: comment.content,
        createdAt: comment.createdAt,
        user: user
          ? {
              _id: String(user._id),
              username: user.username,
              displayName: user.displayName,
              avatarUrl: user.avatarUrl,
            }
          : null,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}
