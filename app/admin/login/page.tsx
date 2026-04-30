"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Win95Window from "@/components/win95/Win95Window";
import Win95Input from "@/components/win95/Win95Input";
import Win95Button from "@/components/win95/Win95Button";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success) {
        router.push("/admin");
        router.refresh();
      } else {
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Win95Window title="Login.exe" className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h1 className="text-xl font-display font-black text-center mb-4">
            管理员登录
          </h1>

          {error && (
            <div className="win95-inset bg-win95-red/10 p-2 text-sm text-win95-red font-mono">
              ⚠ {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-bold">用户名</label>
            <Win95Input
              value={username}
              onChange={setUsername}
              placeholder="admin"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold">密码</label>
            <Win95Input
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••"
              required
            />
          </div>

          <Win95Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={loading}
          >
            {loading ? "登录中..." : "登录"}
          </Win95Button>
        </form>
      </Win95Window>
    </div>
  );
}
