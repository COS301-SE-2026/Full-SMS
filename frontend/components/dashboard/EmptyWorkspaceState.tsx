"use client";

import { FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyWorkspaceStateProps } from "@/types/dashboard";

export default function EmptyWorkspaceState({
  onCreateWorkspace,
}: Readonly<EmptyWorkspaceStateProps>) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground mb-2">
          No Workspace yet
        </h2>

        <p className="text-foreground/60 mb-6 max-w-md mx-auto">
          Create your first workspace to start analyzing spectroscopy data. Each
          workspace keeps your HDF5 files and analysis results organised.
        </p>

        <Button
          variant="primary"
          size="lg"
          leftIcon={<FolderPlus className="h-5 w-5" />}
          onClick={onCreateWorkspace}
        >
          Create Your First Workspace
        </Button>
      </div>
    </div>
  );
}
