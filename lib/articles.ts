import { connectDB } from "@/lib/db";
import Article from "@/models/Article";

export const JOURNAL_MARKER = "日志";

const journalMatch = {
  $or: [
    { tags: JOURNAL_MARKER },
    { categories: JOURNAL_MARKER },
  ],
};

/** Mongo filter: published journal entries (tag or category is 日志). */
export const journalFilter = {
  published: true,
  ...journalMatch,
};

/** Mongo filter: published articles excluding journal entries. */
export const nonJournalFilter = {
  published: true,
  $nor: [journalMatch],
};

export function isJournalArticle(article: {
  tags?: string[] | null;
  categories?: string[] | null;
}): boolean {
  return (
    article.tags?.includes(JOURNAL_MARKER) === true ||
    article.categories?.includes(JOURNAL_MARKER) === true
  );
}

export async function findPublishedArticle(rawSlug: string) {
  const slug = decodeURIComponent(rawSlug);
  let article = await Article.findOne({ slug, published: true }).lean();
  if (!article && slug !== rawSlug) {
    article = await Article.findOne({ slug: rawSlug, published: true }).lean();
  }
  return article;
}

export async function findPublishedArticles(options: {
  kind: "article" | "journal";
  limit?: number;
}) {
  await connectDB();
  const filter = options.kind === "journal" ? journalFilter : nonJournalFilter;
  let query = Article.find(filter).sort({ date: -1 });
  if (options.limit != null) {
    query = query.limit(options.limit);
  }
  const articles = await query.lean();
  return JSON.parse(JSON.stringify(articles));
}
