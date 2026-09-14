"use client";

import React, { useEffect, useState } from "react";
import { getUserHdf5Uploads } from "@/services/hdf5services";
import { useAuth } from "@/contexts/authContext/AuthContext";
import { Card, CardHeader, CardDescription, CardTitle, Loader } from "../ui";
import { UploadRecord } from "@/types/hdf5";

export default function RecentUploads() {
  const auth = useAuth();
  const [userUploads, setUserUploads] = useState<{ data: UploadRecord[] }>({
    data: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchUploads = async () => {
    setIsLoading(true);
    try {
      const uploads = await getUserHdf5Uploads();
      if (uploads) {
        setUserUploads(uploads);
      }
    } catch (e) {
      console.error("Failed to fetch uploads:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (auth?.user) {
      fetchUploads();
    }
  }, [auth?.user]);

  const getRelativeDaysAgo = (isoString: string): string => {
    const past = new Date(isoString);
    const now = new Date();

    const diffMs = past.getTime() - now.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    return rtf.format(diffDays, "day");
  };

  return (
    <div className="flex flex-col justify-center">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider text-center">
          Recent Uploads
        </h3>
        <div className="w-16 h-0.5 bg-primary/30 mx-auto mt-1"></div>
      </div>
      {isLoading ? (
        <Loader />
      ) : userUploads.data?.length === 0 ? (
        <p className="text-center text-foreground/50 text-sm py-4">
          No uploads yet
        </p>
      ) : (
        userUploads.data?.slice(0, 5).map((upload) => (
          <Card key={upload.id} className="mb-2 border border-primary outline">
            <CardHeader>
              <CardTitle>{upload.filename}</CardTitle>
              <CardDescription className="flex flex-row justify-items-end-safe">
                <span className="mr-4">
                  {(upload.size_bytes / (1024 * 1024)).toFixed(1)} MB
                </span>
                <span>Uploaded {getRelativeDaysAgo(upload.created_at)}</span>
              </CardDescription>
            </CardHeader>
          </Card>
        ))
      )}
    </div>
  );
}
