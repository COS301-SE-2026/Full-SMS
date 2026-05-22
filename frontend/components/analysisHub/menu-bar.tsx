import Link from "next/link";


interface MenuBarProps {
  onOpenFileUpload: () => void;
}

export function MenuBar({ onOpenFileUpload }: MenuBarProps) {

  return (
    <div className="flex items-center h-7 px-2 border-b border-border bg-background">
        <button
          onClick={onOpenFileUpload}
          className="px-3 h-full text-xs text-foreground hover:bg-card rounded-sm transition-colors"
        >
          File
        </button>
      <Link href="/profile">
          <button
            onClick={onOpenFileUpload}
            className="px-3 h-full text-xs text-foreground hover:bg-card rounded-sm transition-colors"
          >
            Account
          </button>
      </Link>

    </div>
  );
}
