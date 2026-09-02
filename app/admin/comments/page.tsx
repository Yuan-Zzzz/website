"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Win95Window from "@/components/win95/Win95Window";
import Win95Button from "@/components/win95/Win95Button";

interface AdminComment {
  _id: string;
  articleSlug: string;
  articleTitle: string;
  content: string;
  createdAt: string;
  user: {
    _id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
  } | null;
}

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/comments");
      const data = await res.json();
      if (data.success) {
        setComments(data.data);
      }
    } catch (fetchError) {
      console.error("Failed to fetch comments:", fetchError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  async function deleteComment(id: string) {
    if (!confirm("确定要删除这条评论吗？")) return;

    try {
      const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setComments((prev) => prev.filter((c) => c._id !== id));
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
        <h1 className="text-2xl font-display font-black">评论管理</h1>
        <Link href="/admin" className="no-underline">
          <Win95Button>← 返回面板</Win95Button>
        </Link>
      </div>

      <Win95Window title="Comments.db">
        {loading ? (
          <div className="text-center py-8 font-mono text-win95-gray">加载中...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 font-mono text-win95-gray">[暂无评论]</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-win95-bg">
                  <th className="border-2 border-win95-gray p-2 text-left text-xs font-bold">文章</th>
                  <th className="border-2 border-win95-gray p-2 text-left text-xs font-bold">用户</th>
                  <th className="border-2 border-win95-gray p-2 text-left text-xs font-bold">内容</th>
                  <th className="border-2 border-win95-gray p-2 text-left text-xs font-bold">时间</th>
                  <th className="border-2 border-win95-gray p-2 text-left text-xs font-bold">操作</th>
                </tr>
              </thead>
              <tbody>
                {comments.map((comment, index) => (
                  <tr
                    key={comment._id}
                    className={index % 2 === 0 ? "bg-white" : "bg-[#E8E8E8]"}
                  >
                    <td className="border-2 border-win95-gray p-2 text-sm">
                      <Link
                        href={`/articles/${comment.articleSlug}`}
                        target="_blank"
                        className="text-win95-blue hover:text-win95-red"
                      >
                        {comment.articleTitle}
                      </Link>
                    </td>
                    <td className="border-2 border-win95-gray p-2 text-xs font-mono">
                      {comment.user?.displayName || "-"}
                    </td>
                    <td className="border-2 border-win95-gray p-2 text-xs max-w-xs truncate">
                      {comment.content}
                    </td>
                    <td className="border-2 border-win95-gray p-2 text-xs font-mono whitespace-nowrap">
                      {new Date(comment.createdAt).toLocaleString("zh-CN")}
                    </td>
                    <td className="border-2 border-win95-gray p-2">
                      <Win95Button
                        variant="danger"
                        className="text-xs px-2 py-1"
                        onClick={() => deleteComment(comment._id)}
                      >
                        删除
                      </Win95Button>
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
