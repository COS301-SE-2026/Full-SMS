"use client";

import { Plugin } from "@/types/plugin";
import { MarketplaceStatus } from "@/types/marketplace";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
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
import { createPortal } from "react-dom";
import { formatDate } from "@/utils/dateTime";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import ActionMenu, { ActionMenuItem } from "@/components/ui/ActionMenu";

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

  const handleAction = (action: () => void) => {
    action();
    setOpenMenuId(null);
  };

  return (
    <Card>
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
                  <ActionMenu
                    id={plugin.id}
                    items={[
                      {
                        label: "Edit",
                        icon: <Pencil className="h-4 w-4" />,
                        onClick: () => onEdit(plugin),
                      },
                      {
                        label: plugin.enabled ? "Disable" : "Enable",
                        icon: plugin.enabled ? (
                          <CircleX className="h-4 w-4" />
                        ) : (
                          <CircleCheck className="h-4 w-4" />
                        ),
                        onClick: () => onToggle(plugin),
                      },
                      {
                        label:
                          submittingId === plugin.id
                            ? "Submitting..."
                            : "Submit to Marketplace",
                        icon: <CloudUpload className="h-4 w-4" />,
                        onClick: () => onSubmitToMarketplace(plugin),
                        disabled: submittingId === plugin.id,
                        hidden: !canSubmitToMarketplace(plugin),
                      },
                      {
                        label:
                          cancellingId === plugin.id
                            ? "Cancelling..."
                            : "Cancel Submission",
                        icon: <XCircle className="h-4 w-4" />,
                        onClick: () => onCancelSubmission(plugin),
                        variant: "warning",
                        disabled: cancellingId === plugin.id,
                        hidden: !canCancelSubmission(plugin),
                      },
                      {
                        label:
                          updatingId === plugin.id
                            ? "Updating..."
                            : "Update Available",
                        icon: <Download className="h-4 w-4" />,
                        onClick: () => onUpdateFromMarketplace?.(plugin),
                        variant: "primary",
                        disabled: updatingId === plugin.id,
                        hidden:
                          !plugin.available_version || !onUpdateFromMarketplace,
                      },
                      {
                        label: "Rejection Feedback",
                        icon: <MessageSquare className="h-4 w-4" />,
                        onClick: () => setFeedbackPlugin(plugin),
                        hidden: !(
                          plugin.marketplace_status === "rejected" &&
                          plugin.review_feedback
                        ),
                      },
                      {
                        label: "Delete",
                        icon: <Trash2 className="h-4 w-4" />,
                        onClick: () => onDelete(plugin),
                        variant: "destructive",
                      },
                    ]}
                  />
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
