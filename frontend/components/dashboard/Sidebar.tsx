"use client";

import { useRouter, usePathname } from "next/navigation";
import { FolderOpen, User, Code, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/authContext/AuthContext";
import { cn } from "@/lib/utils";
import { NavItem, DashboardSidebarProps } from "@/types/dashboard";
import ThemeToggle from "../ui/ThemeToggle";

export default function Sidebar({
  activeItem = "workspaces",
}: Readonly<DashboardSidebarProps>) {
  const { signOut } = useAuth();
  const router = useRouter();

  const pathname = usePathname();

  const excludedRoutes = ["/login", "/signup", "/analysisHub"];

  if (excludedRoutes.includes(pathname)) {
    return null;
  }

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
              <item.icon size={20} />
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
