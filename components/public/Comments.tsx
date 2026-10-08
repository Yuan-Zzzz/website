"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import type { GiscusProps } from "@giscus/react";
import Win95Window from "@/components/win95/Win95Window";
import Win95Button from "@/components/win95/Win95Button";

export interface CommentsConfig {
  repo: `${string}/${string}`;
  repoId: string;
  category: string;
  categoryId: string;
}

interface Props {
  term: string;
  title?: string;
  config: CommentsConfig | null;
}

function CommentWidget({ term, config }: { term: string; config: CommentsConfig }) {
  const container = useRef<HTMLDivElement>(null);
  const [Widget, setWidget] = useState<ComponentType<GiscusProps> | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [discussionUrl, setDiscussionUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      if (active) setStatus("error");
    }, 25000);

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== "https://giscus.app") return;
      const host = container.current?.querySelector("giscus-widget");
      const frame = host?.shadowRoot?.querySelector("iframe");
      if (!frame?.contentWindow || event.source !== frame.contentWindow) return;
      const data = event.data?.giscus;
      if (!data || typeof data !== "object") return;
      if (typeof data.error === "string" && !data.error.includes("Discussion not found")) {
        window.clearTimeout(timer);
        setStatus("error");
        return;
      }
      if (typeof data.resizeHeight === "number" || "discussion" in data) {
        window.clearTimeout(timer);
        setStatus("ready");
      }
      const url = data.discussion?.url;
      if (typeof url === "string" && url.startsWith(`https://github.com/${config.repo}/discussions/`)) {
        setDiscussionUrl(url);
      }
    };

    window.addEventListener("message", handleMessage);
    import("@giscus/react")
      .then((module) => {
        if (active) setWidget(() => module.default);
      })
      .catch(() => {
        if (active) {
          window.clearTimeout(timer);
          setStatus("error");
        }
      });

    return () => {
      active = false;
      window.clearTimeout(timer);
      window.removeEventListener("message", handleMessage);
    };
  }, [config.repo]);

  const fallbackUrl = discussionUrl ||
    `https://github.com/${config.repo}/discussions?discussions_q=${encodeURIComponent(`category:${config.category} "${term}"`)}`;

  return (
    <>
      <div role="status" aria-live="polite" className="text-sm font-mono mb-3">
        {status === "loading" && <p>正在加载评论…</p>}
        {status === "error" && (
          <p className="win95-inset bg-win95-panel p-3">
            评论暂时无法加载，请检查网络后重试，或前往 GitHub 参与讨论。
          </p>
        )}
      </div>
      <div ref={container} className="min-w-0">
        {Widget && (
          <Widget
            id="giscus-comments"
            repo={config.repo}
            repoId={config.repoId}
            category={config.category}
            categoryId={config.categoryId}
            mapping="specific"
            term={term}
            strict="1"
            reactionsEnabled="1"
            emitMetadata="1"
            inputPosition="top"
            theme="light"
            lang="zh-CN"
            loading="eager"
          />
        )}
      </div>
      <p className="text-xs font-mono mt-3">
        <a href={fallbackUrl} target="_blank" rel="noopener noreferrer">在 GitHub 查看讨论</a>
      </p>
    </>
  );
}

export default function Comments({ term, title = "文章评论", config }: Props) {
  const [attempt, setAttempt] = useState(0);
  return (
    <section id={term === "guestbook" ? "guestbook" : "comments"} aria-label={title}>
      <Win95Window title={term === "guestbook" ? "Guestbook.exe" : "Comments.exe"}>
        <h2 className="text-xl font-display font-black mb-3">{title}</h2>
        <p className="text-sm font-mono mb-4">使用 GitHub 登录后即可评论、回复和点赞。评论将公开显示。</p>
        {config ? (
          <>
            <CommentWidget key={`${term}:${attempt}`} term={term} config={config} />
            <div className="mt-3"><Win95Button onClick={() => setAttempt((value) => value + 1)}>重新加载评论</Win95Button></div>
          </>
        ) : (
          <p className="win95-inset bg-win95-panel p-3 text-sm">评论区正在准备中，请稍后再来。</p>
        )}
      </Win95Window>
    </section>
  );
}
