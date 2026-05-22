"use client";

import { usePathname } from "next/navigation";
import ProtectedRoute from "./ProtectedRoute";

interface ClientLayoutProps {
  children: React.ReactNode;
}

const PUBLIC_ROUTES = ["/login", "/register"];

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return <ProtectedRoute>{children}</ProtectedRoute>;
}
