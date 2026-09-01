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
  XCircle
} from "lucide-react";
import { useState } from "react";
import { formatDate } from "@/utils/dateTime";

interface PluginTableProps {
  plugins: Plugin[];
  onEdit: (plugin: Plugin) => void;
  onToggle: (plugin: Plugin) => void;
  onDelete: (plugin: Plugin) => void;
  onSubmitToMarketplace: (plugin: Plugin) => void;
  onCancelSubmission: (plugin: Plugin) => void;
  submittingId?: string | null;
  cancellingId?: string | null;
}

export default function PluginTable({
  plugins,
  onEdit,
  onToggle,
  onDelete,
  onSubmitToMarketplace,
  onCancelSubmission,
  submittingId,
  cancellingId,
}: PluginTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const getMarketplaceStatusBadge = (status: MarketplaceStatus) => {
    switch (status) {
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
    return plugin.marketplace_status === null;
  };

  const canCancelSubmission = (plugin: Plugin) => {
    return plugin.marketplace_status === "pending_review";
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
                  {getMarketplaceStatusBadge(plugin.marketplace_status)}
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
    </Card>
  );
}
