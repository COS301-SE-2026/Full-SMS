"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal } from "lucide-react";

export interface ActionMenuItem {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  variant?: "default" | "destructive" | "warning" | "primary";
  disabled?: boolean;
  hidden?: boolean;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
  id: string;
}

export default function ActionMenu({ items, id }: Readonly<ActionMenuProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isOpen && !buttonRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isOpen]);

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (isOpen) {
      setIsOpen(false);
      setMenuPosition(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setMenuPosition({
        top: rect.top,
        left: rect.right - 192,
      });
      setIsOpen(true);
    }
  };

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  const getVariantClasses = (variant?: string) => {
    switch (variant) {
      case "destructive":
        return "text-destructive hover:bg-destructive/10";
      case "warning":
        return "text-warning hover:bg-warning/10";
      case "primary":
        return "text-primary hover:bg-primary/10";
      default:
        return "text-foreground hover:bg-border/30";
    }
  };

  const visibleItems = items.filter((item) => !item.hidden);

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="p-2 rounded-lg hover:bg-border/50 transition-colors"
      >
        <MoreHorizontal className="h-4 w-4 text-foreground/60" />
      </button>

      {isOpen &&
        menuPosition &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed w-48 bg-card border border-border rounded-lg shadow-lg z-[9999]"
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
              transform: "translateY(-100%)",
            }}
            onClick={(e) => e.stopPropagation()}
            role="menu"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Escape") setIsOpen(false);
            }}
          >
            {visibleItems.map((item, index) => (
              <button
                key={`${id}-${index}`}
                role="menuitem"
                onClick={() => handleAction(item.onClick)}
                disabled={item.disabled}
                className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors disabled:opacity-50
                    ${getVariantClasses(item.variant)}
                    ${index === 0 ? "rounded-t-lg" : ""}
                    ${index === visibleItems.length - 1 ? "rounded-b-lg" : ""}
                  `}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
