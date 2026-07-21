"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  itemName: string;
  itemType: string;
  description?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmDeleteModal({
  isOpen,
  itemName,
  itemType,
  description,
  onClose,
  onConfirm,
}: ConfirmDeleteModalProps) {
  const defaultDescription = "This action cannot be undone.";

  return (
    <Modal open={isOpen} onClose={onClose} title={`Delete ${itemType}`}>
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-destructive/10 flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="text-foreground">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{itemName}</span>?
            </p>
            <p className="text-sm text-foreground/60 mt-1">
              {description || defaultDescription}
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}
