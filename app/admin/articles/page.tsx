"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Win95Window from "@/components/win95/Win95Window";
import Win95Button from "@/components/win95/Win95Button";

interface Article {
  _id: string;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  published: boolean;
  tags: string[];
}

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchArticles();
  }, []);

  async function fetchArticles() {
    try {
      const res = await fetch("/api/articles");
      const data = await res.json();
      if (data.success) {
        setArticles(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch articles:", error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteArticle(slug: string) {
    if (!confirm("确定要删除这篇文章吗？此操作不可撤销。")) return;

    try {
      const res = await fetch(`/api/articles/${slug}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setArticles(articles.filter((a) => a.slug !== slug));
        router.refresh();
      } else {
        alert(data.error || "删除失败");
      }
    } catch {
      alert("网络错误");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-black">文章管理</h1>
        <Link href="/admin/articles/new" className="no-underline">
          <Win95Button variant="primary">+ 新建文章</Win95Button>
        </Link>
      </div>

      <Win95Window title="Articles.db">
        {loading ? (
          <div className="text-center py-8 font-mono text-win95-gray">
            加载中...
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-8 font-mono text-win95-gray">
            [暂无文章]
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-win95-bg">
                  <th className="border-2 border-win95-gray p-2 text-left text-xs font-bold">标题</th>
                  <th className="border-2 border-win95-gray p-2 text-left text-xs font-bold">日期</th>
                  <th className="border-2 border-win95-gray p-2 text-left text-xs font-bold">标签</th>
                  <th className="border-2 border-win95-gray p-2 text-left text-xs font-bold">状态</th>
                  <th className="border-2 border-win95-gray p-2 text-left text-xs font-bold">操作</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((article, index) => (
                  <tr
                    key={article._id}
                    className={index % 2 === 0 ? "bg-white" : "bg-[#E8E8E8]"}
                  >
                    <td className="border-2 border-win95-gray p-2 text-sm">
                      <Link
                        href={`/articles/${article.slug}`}
                        target="_blank"
                        className="text-win95-blue hover:text-win95-red"
                      >
                        {article.title}
                      </Link>
                    </td>
                    <td className="border-2 border-win95-gray p-2 text-xs font-mono">
                      {new Date(article.date).toLocaleDateString("zh-CN")}
                    </td>
                    <td className="border-2 border-win95-gray p-2 text-xs">
                      {article.tags?.join(", ") || "-"}
                    </td>
                    <td className="border-2 border-win95-gray p-2 text-xs">
                      {article.published ? (
                        <span className="text-win95-green font-bold">已发布</span>
                      ) : (
                        <span className="text-win95-gray">草稿</span>
                      )}
                    </td>
                    <td className="border-2 border-win95-gray p-2">
                      <div className="flex gap-1">
                        <Link href={`/admin/articles/${article.slug}`} className="no-underline">
                          <Win95Button className="text-xs px-2 py-1">编辑</Win95Button>
                        </Link>
                        <Win95Button
                          variant="danger"
                          className="text-xs px-2 py-1"
                          onClick={() => deleteArticle(article.slug)}
                        >
                          删除
                        </Win95Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Win95Window>
    </div>
  );
}
