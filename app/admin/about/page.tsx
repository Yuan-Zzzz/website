"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Win95Window from "@/components/win95/Win95Window";
import Win95Button from "@/components/win95/Win95Button";
import Win95Input from "@/components/win95/Win95Input";
import Win95Textarea from "@/components/win95/Win95Textarea";

export default function AdminAboutPage() {
  const [aboutTitle, setAboutTitle] = useState("");
  const [aboutBody, setAboutBody] = useState("");
  const [aboutTags, setAboutTags] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/site-settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAboutTitle(data.data.aboutTitle || "");
          setAboutBody(data.data.aboutBody || "");
          setAboutTags((data.data.aboutTags || []).join(", "));
        } else {
          setMessage(data.error || "加载失败");
        }
      })
      .catch(() => setMessage("加载失败"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aboutTitle,
          aboutBody,
          aboutTags,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setMessage(data.error || "保存失败");
        return;
      }
      setMessage("已保存");
      router.refresh();
    } catch {
      setMessage("网络错误");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-black">关于我</h1>
        <Link href="/admin" className="no-underline">
          <Win95Button>← 返回</Win95Button>
        </Link>
      </div>

      {message && (
        <div
          className={`win95-inset p-2 text-sm font-mono ${
            message.includes("失败") || message.includes("错误")
              ? "text-win95-red"
              : "text-win95-green"
          }`}
        >
          {message}
        </div>
      )}

      <Win95Window title="About.txt">
        {loading ? (
          <div className="text-center py-8 font-mono text-win95-gray">加载中...</div>
        ) : (
          <div className="space-y-3">
            <Win95Input value={aboutTitle} onChange={setAboutTitle} placeholder="标题" />
            <Win95Textarea
              value={aboutBody}
              onChange={setAboutBody}
              placeholder="正文"
              rows={8}
            />
            <Win95Input
              value={aboutTags}
              onChange={setAboutTags}
              placeholder="标签，逗号分隔"
            />
            <Win95Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? "…" : "保存"}
            </Win95Button>
          </div>
        )}
      </Win95Window>
    </div>
  );
}
