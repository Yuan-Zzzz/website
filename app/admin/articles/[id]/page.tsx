"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Win95Window from "@/components/win95/Win95Window";
import Win95Button from "@/components/win95/Win95Button";
import Win95Input from "@/components/win95/Win95Input";
import Win95Textarea from "@/components/win95/Win95Textarea";
import MarkdownRenderer from "@/components/public/MarkdownRenderer";

interface ArticleFormData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  date: string;
  tags: string;
  categories: string;
  published: boolean;
}

export default function ArticleFormPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string>("");
  const [formData, setFormData] = useState<ArticleFormData>({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    date: new Date().toISOString().split("T")[0],
    tags: "",
    categories: "",
    published: true,
  });
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const router = useRouter();

  useEffect(() => {
    params.then((p) => {
      setId(p.id);
      if (p.id !== "new") {
        setIsEdit(true);
        fetchArticle(p.id);
      }
    });
  }, [params]);

  async function fetchArticle(slug: string) {
    try {
      const res = await fetch(`/api/articles/${slug}`);
      const data = await res.json();
      if (data.success) {
        const article = data.data;
        setFormData({
          title: article.title,
          slug: article.slug,
          content: article.content,
          excerpt: article.excerpt,
          date: new Date(article.date).toISOString().split("T")[0],
          tags: article.tags?.join(", ") || "",
          categories: article.categories?.join(", ") || "",
          published: article.published,
        });
      }
    } catch (error) {
      console.error("Failed to fetch article:", error);
    }
  }

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      date: new Date(formData.date),
      tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
      categories: formData.categories.split(",").map((t) => t.trim()).filter(Boolean),
    };

    if (!payload.slug && payload.title) {
      payload.slug = generateSlug(payload.title);
    }

    try {
      const url = isEdit ? `/api/articles/${id}` : "/api/articles";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        router.push("/admin/articles");
        router.refresh();
      } else {
        alert(data.error || "保存失败");
      }
    } catch {
      alert("网络错误");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-black">
          {isEdit ? "编辑文章" : "新建文章"}
        </h1>
        <Link href="/admin/articles" className="no-underline">
          <Win95Button>← 返回</Win95Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Win95Window title={`${isEdit ? "Edit" : "New"}.txt`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold">标题 *</label>
              <Win95Input
                value={formData.title}
                onChange={(v) => {
                  setFormData({ ...formData, title: v });
                  if (!isEdit && !formData.slug) {
                    setFormData((prev) => ({ ...prev, title: v, slug: generateSlug(v) }));
                  } else {
                    setFormData((prev) => ({ ...prev, title: v }));
                  }
                }}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold">Slug *</label>
              <Win95Input
                value={formData.slug}
                onChange={(v) => setFormData({ ...formData, slug: v })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold">日期</label>
              <Win95Input
                type="date"
                value={formData.date}
                onChange={(v) => setFormData({ ...formData, date: v })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold">标签（逗号分隔）</label>
              <Win95Input
                value={formData.tags}
                onChange={(v) => setFormData({ ...formData, tags: v })}
                placeholder="Unity, C#, GameDev"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold">分类（逗号分隔）</label>
              <Win95Input
                value={formData.categories}
                onChange={(v) => setFormData({ ...formData, categories: v })}
                placeholder="技术, 游戏开发"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold">摘要 *</label>
              <Win95Textarea
                value={formData.excerpt}
                onChange={(v) => setFormData({ ...formData, excerpt: v })}
                rows={3}
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold">内容（Markdown）*</label>
                <Win95Button
                  type="button"
                  onClick={() => setPreview(!preview)}
                  className="text-xs"
                >
                  {preview ? "编辑" : "预览"}
                </Win95Button>
              </div>

              {preview ? (
                <div className="win95-inset bg-white p-4 min-h-[300px] max-h-[500px] overflow-y-auto">
                  <MarkdownRenderer content={formData.content} />
                </div>
              ) : (
                <Win95Textarea
                  value={formData.content}
                  onChange={(v) => setFormData({ ...formData, content: v })}
                  rows={20}
                  required
                />
              )}
            </div>

            <div className="flex items-center gap-2 md:col-span-2">
              <input
                type="checkbox"
                id="published"
                checked={formData.published}
                onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="published" className="text-sm font-bold">
                发布（取消勾选则保存为草稿）
              </label>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Win95Button type="submit" variant="primary" disabled={loading}>
              {loading ? "保存中..." : "保存"}
            </Win95Button>
            <Link href="/admin/articles" className="no-underline">
              <Win95Button type="button">取消</Win95Button>
            </Link>
          </div>
        </Win95Window>
      </form>
    </div>
  );
}
