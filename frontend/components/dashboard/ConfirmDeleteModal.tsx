"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDeleteModalProps } from "@/types/dashboard";

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  workspaceName,
}: ConfirmDeleteModalProps) {
  return (
    <Modal open={isOpen} onClose={onClose} title="Delete Workspace">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <p className="text-foreground">
              Are you sure you want to delete the workspace{" "}
              <span className="font-semibold">{workspaceName}</span>?
            </p>
            <p className="text-sm text-foreground/60 mt-1">
              This action cannot be undone. All files and analysis results
              associated with this workspace will be permanently deleted.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete Workspace
          </Button>
        </div>
      </div>
    </Modal>
  );
}
