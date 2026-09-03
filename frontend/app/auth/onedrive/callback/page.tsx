"use client";

import { Button, Loader } from "@/components/ui";
import { OneDriveAuthService } from "@/services/authServices";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState, useRef, Suspense } from "react";

function OneDriveCallbackContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const alreadyProcessing = useRef(false);

  useEffect(() => {
    const handleAuth = async () => {
      if (!code || alreadyProcessing.current) return;
      alreadyProcessing.current = true;

      try {
        await OneDriveAuthService(code);
        setStatus("success");

        // BroadcastChannel: Notifies the original workspace tab 
        // regardless of window.opener
        try {
          const bc = new BroadcastChannel("onedrive_oauth_channel");
          bc.postMessage({ type: "ONEDRIVE_AUTH_SUCCESS" });
          bc.close();
        } catch (e) {
          console.warn("BroadcastChannel error:", e);
        }

        // localStorage fallback: triggers a 'storage' event in the original workspace tab
        try {
          localStorage.setItem(
            "onedrive_auth_event",
            JSON.stringify({ type: "ONEDRIVE_AUTH_SUCCESS", timestamp: Date.now() })
          );
        } catch (e) {}

        // postMessage fallback (if opener is still attached)
        try {
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage(
              { type: "ONEDRIVE_AUTH_SUCCESS" },
              window.location.origin
            );
          }
        } catch (e) {
          console.error(e)
        }

        setTimeout(() => {
          window.close();
        }, 500)

      } catch (err: any) {
        console.error("OneDrive auth failed:", err);
        setStatus("error");
        setErrorMessage(
          err?.response?.data?.detail || "Could not connect to OneDrive. Please try again."
        );

        try {
          const bc = new BroadcastChannel("onedrive_oauth_channel");
          bc.postMessage({ type: "ONEDRIVE_AUTH_ERROR" });
          bc.close();
        } catch (e) {
          console.error(e)
        }
      }
    };

    void handleAuth();
  }, [code]);

  if (status === "error") {
    return (
      <div className="flex flex-col h-screen items-center justify-center gap-4 text-center p-4">
        <p className="text-destructive font-medium">{errorMessage}</p>
        <Button
          onClick={() => window.close()}
          className="px-4 py-2 border rounded text-sm hover:bg-muted"
        >
          Close Window
        </Button>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col h-screen items-center justify-center gap-2 text-center p-4">
        <p className="text-success font-semibold text-lg">
          OneDrive Connected Successfully!
        </p>
        <p className="text-xs text-muted-foreground">
          Closing window... If it does not close automatically, click below:
        </p>
        <Button
          onClick={() => window.close()}
          className="mt-2 px-4 py-2 border rounded text-sm hover:bg-muted"
        >
          Close Window
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <Loader size="lg" centered />
    </div>
  );
}

export default function OneDriveAuthCallback() {
  return (
    <Suspense fallback={<Loader size="lg" centered />}>
      <OneDriveCallbackContent />
    </Suspense>
  );
}
