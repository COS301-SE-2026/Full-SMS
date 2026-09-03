"use client";

import { useState } from "react";
import { MarketplacePlugin } from "@/types/marketplace";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import CodeEditor from "@/components/plugins/CodeEditor";
import { CheckCircle, XCircle, Code, Settings, FileOutput } from "lucide-react";
import { ReviewPluginModalProps } from "@/types/marketplace";

export default function ReviewPluginModal({
  isOpen,
  plugin,
  isApproving,
  isRejecting,
  onClose,
  onApprove,
  onReject,
}: Readonly<ReviewPluginModalProps>) {
  const [activeTab, setActiveTab] = useState<"code" | "config">("code");

  if (!plugin) return null;

  const isLoading = isApproving || isRejecting;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Review Plugin Submission"
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-border">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-foreground text-lg truncate">
                {plugin.name}
              </h3>
              <Badge variant="warning">Pending Review</Badge>
            </div>
            <p className="text-sm text-foreground/60 mb-2">
              {plugin.description || "No description provided"}
            </p>
            <p className="text-xs text-foreground/40">
              Version {plugin.version} • Submitted{" "}
              {plugin.submitted_at
                ? new Date(plugin.submitted_at).toLocaleDateString()
                : "Unknown"}
            </p>
          </div>
        </div>

        <div className="flex gap-1 border-b border-border">
          <button
            type="button"
            onClick={() => setActiveTab("code")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "code"
                ? "border-primary text-primary"
                : "border-transparent text-foreground/60 hover:text-foreground"
            }`}
          >
            <Code className="h-4 w-4" />
            Script
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("config")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "config"
                ? "border-primary text-primary"
                : "border-transparent text-foreground/60 hover:text-foreground"
            }`}
          >
            <Settings className="h-4 w-4" />
            Configuration
          </button>
        </div>

        {activeTab === "code" ? (
          <div className="space-y-2">
            <p className="text-sm text-foreground/60">
              Review the plugin&apos;s Python script:
            </p>
            <CodeEditor
              value={plugin.script}
              onChange={() => {}}
              readOnly={true}
              height="300px"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Settings className="h-4 w-4 text-foreground/60" />
                <h4 className="text-sm font-medium text-foreground">
                  Parameters ({plugin.config.parameters.length})
                </h4>
              </div>
              {plugin.config.parameters.length > 0 ? (
                <div className="bg-background rounded-lg border border-border p-3 space-y-2">
                  {plugin.config.parameters.map((param) => (
                    <div
                      key={param.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-foreground">{param.label}</span>
                      <Badge variant="secondary">{param.type}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-foreground/40 italic">
                  No parameters defined
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileOutput className="h-4 w-4 text-foreground/60" />
                <h4 className="text-sm font-medium text-foreground">
                  Outputs ({plugin.config.outputs.length})
                </h4>
              </div>
              {plugin.config.outputs.length > 0 ? (
                <div className="bg-background rounded-lg border border-border p-3 space-y-2">
                  {plugin.config.outputs.map((output) => (
                    <div
                      key={output.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-foreground">{output.label}</span>
                      <Badge variant="secondary">{output.type}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-foreground/40 italic">
                  No outputs defined
                </p>
              )}
            </div>

            {plugin.config.requiredPackages &&
              plugin.config.requiredPackages.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">
                    Required Packages
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {plugin.config.requiredPackages.map((pkg) => (
                      <Badge key={pkg} variant="outline">
                        {pkg}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onReject}
            disabled={isLoading}
          >
            <XCircle className="h-4 w-4" />
            {isRejecting ? "Rejecting..." : "Reject"}
          </Button>
          <Button
            variant="primary"
            onClick={onApprove}
            disabled={isLoading}
          >
            <CheckCircle className="h-4 w-4" />
            {isApproving ? "Approving..." : "Approve"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
