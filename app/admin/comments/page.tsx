import Win95Window from "@/components/win95/Win95Window";
import Win95Button from "@/components/win95/Win95Button";

export default function AdminCommentsPage() {
  return (
    <Win95Window title="Comments.exe">
      <h1 className="text-2xl font-display font-black mb-4">评论管理</h1>
      <p className="text-sm font-mono mb-4">
        文章评论与首页留言存放在 GitHub Discussions，可在那里管理评论和回复。
      </p>
      <a
        href="https://github.com/Yuan-Zzzz/website-comments/discussions/categories/comments"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Win95Button>打开 GitHub 评论管理</Win95Button>
      </a>
    </Win95Window>
  );
}
