import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getUserFromRequest } from "@/lib/user-auth";
import { findPublishedArticle } from "@/lib/articles";
import {
  isCommentRateLimited,
  validateCommentContent,
} from "@/lib/comment-rate-limit";
import Comment from "@/models/Comment";

interface Params {
  params: Promise<{ slug: string }>;
}

function serializeComments(comments: Array<Record<string, unknown>>) {
  return comments.map((comment) => {
    const user = comment.userId as Record<string, unknown> | null;
    return {
      _id: String(comment._id),
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
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { slug: rawSlug } = await params;
    await connectDB();

    const article = await findPublishedArticle(rawSlug);
    if (!article) {
      return NextResponse.json(
        { success: false, error: "Article not found" },
        { status: 404 }
      );
    }

    const slug = article.slug as string;
    const comments = await Comment.find({ articleSlug: slug })
      .sort({ createdAt: 1 })
      .populate("userId", "username displayName avatarUrl")
      .lean();

    return NextResponse.json({
      success: true,
      data: serializeComments(comments as Array<Record<string, unknown>>),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await getUserFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { slug: rawSlug } = await params;
    await connectDB();

    const article = await findPublishedArticle(rawSlug);
    if (!article) {
      return NextResponse.json(
        { success: false, error: "Article not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const content = validateCommentContent(body.content);
    if (!content) {
      return NextResponse.json(
        { success: false, error: "Invalid content" },
        { status: 400 }
      );
    }

    if (await isCommentRateLimited(session.userId)) {
      return NextResponse.json(
        { success: false, error: "Too many comments" },
        { status: 429 }
      );
    }

    const comment = await Comment.create({
      articleSlug: article.slug,
      userId: session.userId,
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const populated = await Comment.findById(comment._id)
      .populate("userId", "username displayName avatarUrl")
      .lean();

    const [serialized] = serializeComments([
      populated as Record<string, unknown>,
    ]);

    return NextResponse.json({ success: true, data: serialized }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
