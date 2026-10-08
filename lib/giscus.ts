import "server-only";
import type { CommentsConfig } from "@/components/public/Comments";

// Only public giscus identifiers cross the server/client boundary.
export function getCommentsConfig(): CommentsConfig | null {
  if (process.env.GISCUS_ENABLED === "false") return null;
  const repoId = process.env.GISCUS_REPO_ID || "R_kgDOVAxc4A";
  const categoryId = process.env.GISCUS_CATEGORY_ID || "DIC_kwDOVAxc4M4DHU3s";
  return {
    repo: "Yuan-Zzzz/website-comments",
    repoId,
    category: "Comments",
    categoryId,
  };
}
