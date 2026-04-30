import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Admin Header */}
      <header className="win95-outset bg-win95-bg">
        <div className="win95-title-bar flex items-center justify-between">
          <span>Admin Panel - Yuan Website</span>
          <div className="flex gap-1">
            <span className="text-xs">Administrator</span>
          </div>
        </div>
      </header>

      <div className="flex-1 p-4">
        {children}
      </div>

      {/* Taskbar */}
      <footer className="win95-outset bg-win95-bg py-1 px-2 flex items-center gap-2">
        <Link href="/admin" className="no-underline">
          <button className="win95-btn flex items-center gap-2">
            <span className="text-win95-green text-lg">🪟</span>
            <span className="font-bold">Start</span>
          </button>
        </Link>
        <div className="win95-inset bg-white px-3 py-1 text-xs font-mono flex-1">
          Yuan Website Admin v2.0
        </div>
        <div className="win95-inset bg-white px-3 py-1 text-xs font-mono">
          {new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </footer>
    </div>
  );
}
