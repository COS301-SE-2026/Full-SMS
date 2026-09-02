"use client";

import { useState } from "react";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { RejectPluginModalProps } from "@/types/marketplace";

export default function RejectPluginModal({
  isOpen,
  pluginName,
  isLoading,
  onClose,
  onConfirm,
}: Readonly<RejectPluginModalProps>) {
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (feedback.trim().length < 10) {
      setError("Feedback must be at least 10 characters");
      return;
    }
    setError("");
    onConfirm(feedback.trim());
  };

  const handleClose = () => {
    setFeedback("");
    setError("");
    onClose();
  };

  return (
    <Modal open={isOpen} onClose={handleClose} title="Reject Plugin">
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500/10 flex-shrink-0">
            <XCircle className="h-5 w-5 text-red-500" />
          </div>
          <div className="flex-1">
            <p className="text-foreground">
              Reject <span className="font-semibold">{pluginName}</span> from
              the marketplace?
            </p>
            <p className="text-sm text-foreground/60 mt-1">
              Please provide feedback explaining why this plugin is being
              rejected
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="rejection-feedback"
            className="text-sm font-medium text-foreground"
          >
            Feedback <span className="text-red-500">*</span>
          </label>
          <textarea
            id="rejection-feedback"
            value={feedback}
            onChange={(e) => {
              setFeedback(e.target.value);
              if (error) setError("");
            }}
            placeholder="Explain why this plugin is being rejected..."
            className="w-full h-24 px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors resize-none"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <p className="text-xs text-foreground/40">Minimum 10 characters</p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isLoading || feedback.trim().length < 10}
          >
            {isLoading ? "Rejecting..." : "Reject Plugin"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
