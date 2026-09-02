import Comment from "@/models/Comment";

const MAX_COMMENTS_PER_MINUTE = 3;

export async function isCommentRateLimited(userId: string): Promise<boolean> {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  const count = await Comment.countDocuments({
    userId,
    createdAt: { $gte: oneMinuteAgo },
  });
  return count >= MAX_COMMENTS_PER_MINUTE;
}

export function validateCommentContent(content: unknown): string | null {
  if (typeof content !== "string") return null;
  const trimmed = content.trim();
  if (trimmed.length < 1 || trimmed.length > 2000) return null;
  return trimmed;
}
