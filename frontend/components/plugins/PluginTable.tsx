"use client";

import { Plugin } from "@/types/plugin";
import { MarketplaceStatus } from "@/types/marketplace";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  CircleX,
  CircleCheck,
  Code,
  CloudUpload,
  XCircle,
  MessageSquare,
  Mail,
  Download,
} from "lucide-react";
import { useState } from "react";
import { formatDate } from "@/utils/dateTime";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface PluginTableProps {
  plugins: Plugin[];
  onEdit: (plugin: Plugin) => void;
  onToggle: (plugin: Plugin) => void;
  onDelete: (plugin: Plugin) => void;
  onSubmitToMarketplace: (plugin: Plugin) => void;
  onCancelSubmission: (plugin: Plugin) => void;
  onUpdateFromMarketplace?: (plugin: Plugin) => void;
  submittingId?: string | null;
  cancellingId?: string | null;
  updatingId?: string | null;
}

export default function PluginTable({
  plugins,
  onEdit,
  onToggle,
  onDelete,
  onSubmitToMarketplace,
  onCancelSubmission,
  onUpdateFromMarketplace,
  submittingId,
  cancellingId,
  updatingId,
}: PluginTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [feedbackPlugin, setFeedbackPlugin] = useState<Plugin | null>(null);

  const getMarketplaceStatusBadge = (plugin: Plugin) => {
    console.log("plugin..", plugin);
    if (plugin?.source_plugin_id) {
      if (plugin.available_version) {
        return (
          <Badge
            variant="warning"
            title="An update is available for this plugin from the marketplace"
          >
            Update Available
          </Badge>
        );
      }
      return <Badge variant="outline">Installed</Badge>;
    }
    switch (plugin?.marketplace_status) {
      case "pending_review":
        return <Badge variant="warning">Pending Review</Badge>;
      case "approved":
        return <Badge variant="success">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Not Submitted</Badge>;
    }
  };

  const canSubmitToMarketplace = (plugin: Plugin) => {
    return !plugin.source_plugin_id && plugin.marketplace_status === null;
  };

  const canCancelSubmission = (plugin: Plugin) => {
    return (
      !plugin.source_plugin_id && plugin.marketplace_status === "pending_review"
    );
  };

  const handleMenuToggle = (pluginId: string) => {
    setOpenMenuId(openMenuId === pluginId ? null : pluginId);
  };

  const handleAction = (action: () => void) => {
    action();
    setOpenMenuId(null);
  };

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-card/50">
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground/60">
                Plugin
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground/60">
                Version
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground/60">
                Parameters
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground/60">
                Outputs
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground/60">
                Status
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground/60">
                Marketplace
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground/60">
                Updated
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground/60">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {plugins.map((plugin) => (
              <tr
                key={plugin.id}
                className="border-b border-border last:border-b-0 hover:bg-card/30 transition-colors"
              >
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                      <Code className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {plugin.name}
                      </p>
                      {plugin.description && (
                        <p className="text-sm text-foreground/50 truncate max-w-xs">
                          {plugin.description}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-foreground/60">
                  v{plugin.version}
                </td>
                <td className="px-4 py-4 text-sm text-foreground/60">
                  {plugin.config.parameters.length}
                </td>
                <td className="px-4 py-4 text-sm text-foreground/60">
                  {plugin.config.outputs.length}
                </td>
                <td className="px-4 py-4">
                  <Badge variant={plugin.enabled ? "success" : "secondary"}>
                    {plugin.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </td>
                <td className="px-4 py-4">
                  {getMarketplaceStatusBadge(plugin)}
                </td>
                <td className="px-4 py-4 text-sm text-foreground/60">
                  {formatDate(plugin.updated_at)}
                </td>
                <td className="px-4 py-4">
                  <div className="relative inline-block">
                    <button
                      onClick={() => handleMenuToggle(plugin.id)}
                      className="p-2 rounded-lg hover:bg-border/50 transition-colors"
                    >
                      <MoreHorizontal className="h-4 w-4 text-foreground/60" />
                    </button>

                    {openMenuId === plugin.id && (
                      <div
                        role="menu"
                        className="absolute right-0 top-full mt-1 w-56 bg-card border border-border rounded-lg shadow-lg z-10"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            setOpenMenuId(null);
                          }
                        }}
                      >
                        <button
                          role="menuitem"
                          onClick={() => handleAction(() => onEdit(plugin))}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-border/30 transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </button>

                        <button
                          role="menuitem"
                          onClick={() => handleAction(() => onToggle(plugin))}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-border/30 transition-colors"
                        >
                          {plugin.enabled ? (
                            <>
                              <CircleX className="h-4 w-4" />
                              Disable
                            </>
                          ) : (
                            <>
                              <CircleCheck className="h-4 w-4" />
                              Enable
                            </>
                          )}
                        </button>

                        {canSubmitToMarketplace(plugin) && (
                          <button
                            onClick={() =>
                              handleAction(() => onSubmitToMarketplace(plugin))
                            }
                            disabled={submittingId === plugin.id}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-border/30 transition-colors disabled:opacity-50"
                          >
                            <CloudUpload className="h-4 w-4" />
                            {submittingId === plugin.id
                              ? "Submitting..."
                              : "Submit to Marketplace"}
                          </button>
                        )}

                        {canCancelSubmission(plugin) && (
                          <button
                            onClick={() =>
                              handleAction(() => onCancelSubmission(plugin))
                            }
                            disabled={cancellingId === plugin.id}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-warning hover:bg-warning/10 transition-colors disabled:opacity-50"
                          >
                            <XCircle className="h-4 w-4" />
                            {cancellingId === plugin.id
                              ? "Cancelling..."
                              : "Cancel Submission"}
                          </button>
                        )}

                        {plugin.available_version &&
                          onUpdateFromMarketplace && (
                            <button
                              type="button"
                              onClick={() =>
                                handleAction(() =>
                                  onUpdateFromMarketplace(plugin),
                                )
                              }
                              disabled={updatingId === plugin.id}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                            >
                              <Download className="h-4 w-4" />
                              {updatingId === plugin.id
                                ? "Updating..."
                                : "Update Available"}
                            </button>
                          )}

                        {plugin.marketplace_status === "rejected" &&
                          plugin.review_feedback && (
                            <button
                              type="button"
                              onClick={() =>
                                handleAction(() => setFeedbackPlugin(plugin))
                              }
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-destructive/10 transition-colors"
                            >
                              <MessageSquare className="h-4 w-4" />
                              Rejection Feedback
                            </button>
                          )}

                        <button
                          role="menuitem"
                          onClick={() => handleAction(() => onDelete(plugin))}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal
        open={feedbackPlugin !== null}
        onClose={() => setFeedbackPlugin(null)}
        title="Rejection Feedback"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-destructive/10 flex-shrink-0">
              <MessageSquare className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">
                {feedbackPlugin?.name}
              </p>
              <p className="text-sm text-foreground/60">
                Your plugin submission was rejected
              </p>
            </div>
          </div>

          <div className="p-4 bg-background border border-border rounded-lg">
            <p className="text-sm font-medium text-foreground mb-2">Reason:</p>
            <p className="text-sm text-foreground/70">
              {feedbackPlugin?.review_feedback}
            </p>
          </div>

          <p className="text-xs text-foreground/50">
            You can edit your plugin to address the feedback and resubmit for
            review.
          </p>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setFeedbackPlugin(null)}>
              Close
            </Button>
            {/* {feedbackPlugin?.reviewer_email && (
              <a
                href={`mailto:${feedbackPlugin.reviewer_email}?subject=Plugin Rejection Inquiry: ${feedbackPlugin.name}&body=Hi,%0D%0A%0D%0AI would like to inquire about the rejection of my plugin "${feedbackPlugin.name}".%0D%0A%0D%0ARejection feedback: ${feedbackPlugin.review_feedback}%0D%0A%0D%0AThank you.`}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Mail className="h-4 w-4" />
                Contact Reviewer
              </a>
            )} */}
          </div>
        </div>
      </Modal>
    </Card>
  );
}
