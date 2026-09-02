"use client";

import { useState } from "react";
import { MarketplacePlugin } from "@/types/marketplace";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Eye, Clock } from "lucide-react";
import ReviewPluginModal from "./ReviewPluginModal";
import RejectPluginModal from "./RejectPluginModal";
import { PendingReviewContentProps } from "@/types/marketplace";
import { Button } from "@/components/ui/Button";

export default function PendingReviewContent({
  pendingPlugins,
  approvingId,
  rejectingId,
  onApprove,
  onReject,
}: Readonly<PendingReviewContentProps>) {
  const [reviewPlugin, setReviewPlugin] = useState<MarketplacePlugin | null>(
    null,
  );
  const [rejectPlugin, setRejectPlugin] = useState<MarketplacePlugin | null>(
    null,
  );

  const handleReviewClick = (plugin: MarketplacePlugin) => {
    setReviewPlugin(plugin);
  };

  const handleApproveFromReview = () => {
    if (reviewPlugin) {
      onApprove(reviewPlugin.id);
      setReviewPlugin(null);
    }
  };

  const handleRejectFromReview = () => {
    if (reviewPlugin) {
      setRejectPlugin(reviewPlugin);
      setReviewPlugin(null);
    }
  };

  const handleRejectConfirm = (feedback: string) => {
    if (rejectPlugin) {
      onReject(rejectPlugin.id, feedback);
      setRejectPlugin(null);
    }
  };

  if (pendingPlugins.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-foreground/60 mb-2">
          0 plugins awaiting review
        </p>
        <Card>
          <CardContent className="py-16 text-center">
            <Clock className="h-12 w-12 text-foreground/20 mx-auto mb-4" />
            <p className="text-foreground/60">No plugins pending review</p>
            <p className="text-sm text-foreground/40 mt-1">
              Submitted plugins will appear here for approval
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <p className="text-sm text-foreground/60 mb-2">
          {pendingPlugins.length} plugin{pendingPlugins.length !== 1 ? "s" : ""}{" "}
          awaiting review
        </p>
        {pendingPlugins.map((plugin) => (
          <Card
            key={plugin.id}
            className="hover:border-primary/30 transition-colors"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-foreground text-lg truncate">
                      {plugin.name}
                    </h3>
                    <Badge variant="warning">Pending Review</Badge>
                  </div>
                  <p className="text-sm text-foreground/60 mb-3 line-clamp-2">
                    {plugin.description || "No description provided"}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-foreground/40">
                    <span>Version {plugin.version}</span>
                    <span>-</span>
                    <span>{plugin.config.parameters.length} parameters</span>
                    <span>-</span>
                    <span>{plugin.config.outputs.length} outputs</span>
                    <span>-</span>
                    <span>
                      Submitted{" "}
                      {plugin.submitted_at
                        ? new Date(plugin.submitted_at).toLocaleDateString()
                        : "Unknown"}
                    </span>
                  </div>
                </div>
                <div className="shrink-0">
                  <Button
                    type="button"
                    onClick={() => handleReviewClick(plugin)}
                    variant="primary"
                    size="sm"
                  >
                    <Eye className="h-4 w-4" />
                    Review
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ReviewPluginModal
        isOpen={reviewPlugin !== null}
        plugin={reviewPlugin}
        isApproving={approvingId === reviewPlugin?.id}
        isRejecting={false}
        onClose={() => setReviewPlugin(null)}
        onApprove={handleApproveFromReview}
        onReject={handleRejectFromReview}
      />

      <RejectPluginModal
        isOpen={rejectPlugin !== null}
        pluginName={rejectPlugin?.name || ""}
        isLoading={rejectingId === rejectPlugin?.id}
        onClose={() => setRejectPlugin(null)}
        onConfirm={handleRejectConfirm}
      />
    </>
  );
}
