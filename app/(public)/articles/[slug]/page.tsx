export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { connectDB } from "@/lib/db";
import Article from "@/models/Article";
import Win95Window from "@/components/win95/Win95Window";
import Win95Button from "@/components/win95/Win95Button";
import MarkdownRenderer from "@/components/public/MarkdownRenderer";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getArticle(rawSlug: string) {
  await connectDB();
  // Next.js may pass URL-encoded or decoded slug; try both
  const slug = decodeURIComponent(rawSlug);
  let article = await Article.findOne({ slug, published: true }).lean();
  if (!article && slug !== rawSlug) {
    article = await Article.findOne({ slug: rawSlug, published: true }).lean();
  }
  if (!article) return null;
  return JSON.parse(JSON.stringify(article));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: "Not Found" };
  return {
    title: `${article.title} - Yuan`,
    description: article.excerpt,
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="win95-outset bg-win95-bg p-2">
        <Link href="/articles" className="no-underline">
          <Win95Button>← 返回列表</Win95Button>
        </Link>
      </div>

      {/* Article Content */}
      <Win95Window title={`${article.title}.txt`}>
        {/* Meta */}
        <div className="win95-inset bg-win95-panel p-3 mb-4">
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
            <span>
              Date: <span className="text-win95-blue">{new Date(article.date).toLocaleDateString("zh-CN")}</span>
            </span>
            {article.tags?.length > 0 && (
              <span>
                Tags:{" "}
                {article.tags.map((tag: string) => (
                  <span key={tag} className="text-win95-green mr-1">
                    [{tag}]
                  </span>
                ))}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <MarkdownRenderer content={article.content} />

        {/* Footer */}
        <div className="hr-groove my-6" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-win95-gray">
            Published: {new Date(article.date).toLocaleDateString("zh-CN")}
          </span>
          <Link href="/articles" className="no-underline">
            <Win95Button>← 返回列表</Win95Button>
          </Link>
        </div>
      </Win95Window>
    </div>
  );
}
