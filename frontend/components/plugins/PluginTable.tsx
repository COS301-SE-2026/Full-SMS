"use client";

import { Plugin } from "@/types/plugin";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Code,
} from "lucide-react";
import { useState } from "react";

interface PluginTableProps {
  plugins: Plugin[];
  onEdit: (plugin: Plugin) => void;
  onToggle: (plugin: Plugin) => void;
  onDelete: (plugin: Plugin) => void;
}

export default function PluginTable({
  plugins,
  onEdit,
  onToggle,
  onDelete,
}: PluginTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleMenuToggle = (pluginId: string) => {
    setOpenMenuId(openMenuId === pluginId ? null : pluginId);
  };

  const handleAction = (action: () => void) => {
    action();
    setOpenMenuId(null);
  };

  return (
    <Card className="overflow-visible">
      <div className="overflow-x-auto overflow-y-visible">
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
                        className="absolute right-0 bottom-full mb-1 w-48 bg-card border border-border rounded-lg shadow-lg z-50"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleAction(() => onEdit(plugin))}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-border/30 transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </button>

                        <button
                          onClick={() => handleAction(() => onToggle(plugin))}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-border/30 transition-colors"
                        >
                          {plugin.enabled ? (
                            <>
                              <ToggleLeft className="h-4 w-4" />
                              Disable
                            </>
                          ) : (
                            <>
                              <ToggleRight className="h-4 w-4" />
                              Enable
                            </>
                          )}
                        </button>

                        <button
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
