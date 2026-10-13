import Win95Button from "@/components/win95/Win95Button";

interface GameStoreButtonProps {
  steamUrl?: string;
  itchUrl?: string;
  className?: string;
}

export default function GameStoreButton({
  steamUrl,
  itchUrl,
  className = "",
}: GameStoreButtonProps) {
  const href = steamUrl || itchUrl;
  if (!href) return null;

  const label = steamUrl ? "在 Steam 上查看" : "在 Itch.io 上玩";

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`no-underline ${className}`}>
      <Win95Button variant="primary">{label}</Win95Button>
    </a>
  );
}
