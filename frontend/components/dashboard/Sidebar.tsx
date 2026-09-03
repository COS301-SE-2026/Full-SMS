"use client";

import { useRouter, usePathname } from "next/navigation";
import { FolderOpen, User, Code, LogOut, Store } from "lucide-react";
import { useAuth } from "@/contexts/authContext/AuthContext";
import { cn } from "@/lib/utils";
import { NavItem, DashboardSidebarProps } from "@/types/dashboard";
import ThemeToggle from "../ui/ThemeToggle";
import { useEffect, useState } from "react";
import { isAdmin } from "@/types/auth";
import { marketplaceService } from "@/services/marketplaceService";

export default function Sidebar({
  activeItem = "workspaces",
}: Readonly<DashboardSidebarProps>) {
  const { signOut, user } = useAuth();
  const router = useRouter();
  const [pendingReviewCount, setPendingReviewCount] = useState<number>(0);

  const pathname = usePathname();

  const excludedRoutes = ["/login", "/signup", "/analysisHub"];

  if (excludedRoutes.includes(pathname)) {
    return null;
  }

  useEffect(() => {
    const fetchPendingReviewCount = async () => {
      if (!isAdmin(user)) return;

      try {
        const response = await marketplaceService.getPluginsInReview();
        if (response.success && response.data) {
          setPendingReviewCount(response.data.length);
        }
      } catch (error) {
        console.error("Failed to fetch pending review count:", error);
      }
    };

    fetchPendingReviewCount();
  }, [user]);

  const navItems: NavItem[] = [
    {
      label: "Workspaces",
      icon: FolderOpen,
      key: "workspaces",
      onClick: () => router.push("/dashboard"),
    },
    {
      label: "Plugins",
      icon: Code,
      key: "plugins",
      onClick: () => {
        router.push("/plugins");
      },
    },
    {
      label: "Plugins Marketplace",
      icon: Store,
      key: "plugins-marketplace",
      onClick: () => {
        router.push("/marketplace");
      },
      badge:
        isAdmin(user) && pendingReviewCount > 0
          ? pendingReviewCount
          : undefined,
    },
    {
      label: "Profile",
      icon: User,
      key: "profile",
      onClick: () => router.push("/profile"),
    },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <aside className="flex flex-col w-[195px] shrink-0 border-r border-border bg-background">
      <div className="flex flex-row justify-between items-center h-[49px] px-3.5 border-b border-border">
        <h3 className="text-foreground font-semibold">FullSMS</h3>
        <ThemeToggle toggleType="icon"/>
      </div>
      <nav className="flex flex-col py-1 flex-1">
        {navItems.map((item) => {
          const isActive = item.key === activeItem;
          return (
            <button
              key={item.key}
              onClick={item.onClick}
              className={cn(
                "flex items-center gap-3 px-4 py-3 text-base transition-colors",
                isActive
                  ? "bg-primary text-background"
                  : "text-foreground hover:bg-card",
              )}
            >
              <div className="relative">
                <item.icon size={20} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center bg-red-500 text-white">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="border-t border-border py-1">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 text-base transition-colors text-destructive hover:bg-destructive/10 w-full"
        >
          <LogOut size={20} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
