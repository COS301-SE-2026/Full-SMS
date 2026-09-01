"use client";

import { Loader } from "@/components/ui";
import { OneDriveAuthService } from "@/services/authServices";
import { useAuth } from "@/contexts/authContext/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState, useRef } from "react";

export default function OneDriveAuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const { setShowPicker } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const processingRef = useRef(false);

  useEffect(() => {
    let active = true;

    const handleAuth = async () => {
      if (!code || processingRef.current) return;
      processingRef.current = true;

      console.log("Processing OneDrive auth callback, code:", code);
      window.history.replaceState({}, document.title, window.location.pathname);

      try {
        await OneDriveAuthService(code);
        if (active) {
          setShowPicker(true);
          router.push("/workspace");
        }
      } catch (err) {
        console.error("OneDrive auth failed:", err);
        if (active) setError("Failed to authenticate with OneDrive.");
      }
    };

    void handleAuth();

    return () => {
      active = false;
    };
  }, [code, router, setShowPicker]);

  if (error) {
    return <div className="p-8 text-destructive font-medium">{error}</div>;
  }

  return (
    <div>
      <Loader size="lg" centered />
    </div>
  );
}
