"use client";

import { FolderPlus, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyWorkspaceStateProps } from "@/types/dashboard";

const SAMPLE_DATA_URL = "https://drive.google.com/drive/folders/1N2aad49y84GglHph55xR5YPGt0tPfaqU";

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

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="primary"
            size="lg"
            leftIcon={<FolderPlus className="h-5 w-5" />}
            onClick={onCreateWorkspace}
          >
            Create Your First Workspace
          </Button>
        </div>

        <div className="mt-8 p-4 bg-card border border-border rounded-lg max-w-md mx-auto">
          <p className="text-sm text-foreground/70 mb-3">
            Need sample data to get started?
          </p>
          <a
            href={SAMPLE_DATA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 text-sm font-medium transition-colors"
          >
            <Download className="h-4 w-4" />
            Download Sample HDF5 Datasets
          </a>
        </div>
      </div>
    </div>
  );
}
