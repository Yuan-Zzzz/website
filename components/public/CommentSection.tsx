"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Win95Button from "@/components/win95/Win95Button";
import Win95Textarea from "@/components/win95/Win95Textarea";

interface CommentUser {
  _id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
}

interface Comment {
  _id: string;
  content: string;
  createdAt: string;
  user: CommentUser | null;
}

interface SessionUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
}

interface CommentSectionProps {
  articleSlug: string;
}

export default function CommentSection({ articleSlug }: CommentSectionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [comments, setComments] = useState<Comment[]>([]);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const oauthError =
    searchParams.get("error") === "auth_failed" ? "GitHub 登录失败，请重试。" : null;
  const displayError = error || oauthError;

  const fetchComments = useCallback(async () => {
    const res = await fetch(`/api/articles/${encodeURIComponent(articleSlug)}/comments`);
    const data = await res.json();
    if (data.success) {
      setComments(data.data);
    }
  }, [articleSlug]);

  const fetchSession = useCallback(async () => {
    const res = await fetch("/api/auth/me");
    const data = await res.json();
    if (data.success && data.data) {
      setUser(data.data);
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      await Promise.all([fetchComments(), fetchSession()]);
      setLoading(false);
    }
    load();
  }, [fetchComments, fetchSession]);

  useEffect(() => {
    if (searchParams.get("error") !== "auth_failed") return;

    const params = new URLSearchParams(searchParams.toString());
    params.delete("error");
    const next = params.toString() ? `?${params.toString()}` : "";
    router.replace(`${pathname}${next}`);
  }, [pathname, router, searchParams]);

  function handleLogin() {
    const returnTo = `${window.location.pathname}${window.location.search}`;
    window.location.href = `/api/auth/github?returnTo=${encodeURIComponent(returnTo)}`;
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/articles/${encodeURIComponent(articleSlug)}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        }
      );
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "发表评论失败");
        return;
      }

      setContent("");
      setComments((prev) => [...prev, data.data]);
    } catch {
      setError("网络错误，请稍后重试。");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    if (!confirm("确定要删除这条评论吗？")) return;

    try {
      const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setComments((prev) => prev.filter((c) => c._id !== commentId));
      } else {
        alert(data.error || "删除失败");
      }
    } catch {
      alert("网络错误");
    }
  }

  return (
    <div className="space-y-4">
      {displayError && (
        <div className="win95-inset bg-win95-panel p-2 text-xs font-mono text-win95-red">
          {displayError}
        </div>
      )}

      {loading ? (
        <div className="text-center py-4 font-mono text-win95-gray text-sm">
          加载评论中...
        </div>
      ) : user ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 win95-outset bg-win95-bg p-2">
            <div className="flex items-center gap-2 min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={user.avatarUrl}
                alt={user.displayName}
                width={24}
                height={24}
                className="win95-inset"
              />
              <span className="text-sm font-bold truncate">{user.displayName}</span>
              <span className="text-xs font-mono text-win95-gray truncate">
                @{user.username}
              </span>
            </div>
            <Win95Button className="text-xs px-2 py-1 shrink-0" onClick={handleLogout}>
              登出
            </Win95Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-2">
            <Win95Textarea
              value={content}
              onChange={setContent}
              placeholder="写下你的评论..."
              rows={4}
              disabled={submitting}
            />
            <div className="flex justify-end">
              <Win95Button type="submit" variant="primary" disabled={submitting || !content.trim()}>
                {submitting ? "提交中..." : "发表评论"}
              </Win95Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="win95-outset bg-win95-bg p-4 text-center space-y-3">
          <p className="text-sm font-mono">登录后即可发表评论</p>
          <Win95Button variant="primary" onClick={handleLogin}>
            Sign in with GitHub
          </Win95Button>
        </div>
      )}

      <div className="hr-groove" />

      {comments.length === 0 ? (
        <div className="text-center py-4 font-mono text-win95-gray text-sm">
          [暂无评论，来抢沙发吧]
        </div>
      ) : (
        <ul className="space-y-3">
          {comments.map((comment) => (
            <li key={comment._id} className="win95-inset bg-white p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  {comment.user && (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={comment.user.avatarUrl}
                        alt={comment.user.displayName}
                        width={32}
                        height={32}
                        className="win95-inset shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                          <a
                            href={`https://github.com/${comment.user.username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold"
                          >
                            {comment.user.displayName}
                          </a>
                          <span className="text-win95-gray">
                            {new Date(comment.createdAt).toLocaleString("zh-CN")}
                          </span>
                        </div>
                        <p className="mt-2 text-sm whitespace-pre-wrap break-words">
                          {comment.content}
                        </p>
                      </div>
                    </>
                  )}
                </div>
                {user && comment.user && user.id === comment.user._id && (
                  <Win95Button
                    variant="danger"
                    className="text-xs px-2 py-1 shrink-0"
                    onClick={() => handleDelete(comment._id)}
                  >
                    删除
                  </Win95Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
