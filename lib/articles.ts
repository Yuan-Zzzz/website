import Article from "@/models/Article";

export async function findPublishedArticle(rawSlug: string) {
  const slug = decodeURIComponent(rawSlug);
  let article = await Article.findOne({ slug, published: true }).lean();
  if (!article && slug !== rawSlug) {
    article = await Article.findOne({ slug: rawSlug, published: true }).lean();
  }
  return article;
}
