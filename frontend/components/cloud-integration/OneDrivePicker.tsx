"use client";

import React, { useEffect, useState } from "react";
import { Loader, Button, Card } from "@/components/ui";
import axiosInstance from "@/lib/api/axiosInstance";
import { FaFolder, FaFile, FaArrowLeft } from "react-icons/fa";

interface DriveItem {
  id: string;
  name: string;
  size: number;
  folder?: { childCount: number };
  file?: { mimeType: string };
}

interface OneDrivePickerProps {
  onFilePicked: (fileId: string, filename: string) => void;
  onCancel: () => void;
}

export function OneDrivePicker({
  onFilePicked,
  onCancel,
}: OneDrivePickerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<DriveItem[]>([]);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [history, setHistory] = useState<{ id: string | null; name: string }[]>(
    [{ id: null, name: "Root" }],
  );
  const [token, setToken] = useState<string | null>(null);

  // Only allow these file types
  const FILE_EXTS = [".h5", ".hdf5", ".pt3", ".csv"];

  // Grab the token from our backend
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data } = await axiosInstance.get(
          "/api/py/cloud/onedrive/token",
        );
        setToken(data.access_token);
        console.log("Got OneDrive token");
      } catch (err) {
        console.error("Token fetch failed", err);
        setError("Could not authenticate with OneDrive. Try reconnecting.");
        setLoading(false);
      }
    };
    fetchToken();
  }, []);

  //Load files & folders from Microsoft Graph whenever token or folder changes
  useEffect(() => {
    if (!token) return;

    const fetchDriveItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const endpoint = folderId
          ? `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}/children`
          : `https://graph.microsoft.com/v1.0/me/drive/root/children`;

        const res = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Graph API returned ${res.status}`);
        }

        const data = await res.json();
        setItems(data.value || []);
      } catch (err: any) {
        console.error("Error loading OneDrive items", err);
        setError("Something went wrong while fetching files.");
      } finally {
        setLoading(false);
      }
    };

    fetchDriveItems();
  }, [token, folderId]);

  const clickItem = (item: DriveItem) => {
    if (item.folder) {
      // go deeper
      setHistory((prev) => [...prev, { id: item.id, name: item.name }]);
      setFolderId(item.id);
    } else {
      onFilePicked(item.id, item.name);
    }
  };

  const goBack = () => {
    if (history.length <= 1) return;
    const newHistory = history.slice(0, -1);
    setHistory(newHistory);
    setFolderId(newHistory[newHistory.length - 1].id);
  };

  const fileAllowed = (fileName: string) => {
    return FILE_EXTS.some((ext) => fileName.toLowerCase().endsWith(ext));
  };

  return (
    <Card className="flex flex-col h-[550px] w-[550px] bg-card rounded-md overflow-hidden border border-border mt-8">
      {/* Top bar */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/40">
        <div className="flex items-center gap-2">
          {history.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={goBack}
              className="p-2 h-8"
            >
              <FaArrowLeft size={12} />
            </Button>
          )}
          <span className="font-semibold text-sm">
            {history.map((h) => h.name).join(" / ")}
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      {/* File list area */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader size="lg" centered />
          </div>
        ) : error ? (
          <div className="flex flex-col h-full items-center justify-center text-destructive text-sm gap-2">
            <p>{error}</p>
            <Button size="sm" onClick={onCancel}>
              Close
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            This folder is empty.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-1">
            {items.map((item) => {
              const isFolder = !!item.folder;
              const allowed = isFolder || fileAllowed(item.name);
              return (
                <div
                  key={item.id}
                  onClick={() => allowed && clickItem(item)}
                  className={`flex items-center justify-between p-3 rounded-md transition-colors ${
                    allowed
                      ? "hover:bg-muted cursor-pointer text-foreground"
                      : "opacity-40 cursor-not-allowed text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    {isFolder ? (
                      <FaFolder
                        className="text-warning shrink-0"
                        size={18}
                      />
                    ) : (
                      <FaFile className="text-primary shrink-0" size={16} />
                    )}
                    <span className="text-sm truncate font-medium">
                      {item.name}
                    </span>
                  </div>
                  {!isFolder && item.size && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {(item.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
