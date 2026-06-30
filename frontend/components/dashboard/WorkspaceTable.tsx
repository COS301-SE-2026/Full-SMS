"use client";

import { useState } from "react";
import {
  MoreHorizontal,
  FolderOpen,
  Archive,
  RotateCcw,
  Trash2,
  FileText,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { WorkspaceTableRow } from "@/types/workspace";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { WorkspaceTableProps } from "@/types/workspace";
import { formatDate, formatRelativeTime } from "@/utils/dateTime";

export default function WorkspaceTable({
  workspaces,
  onOpen,
  onDelete,
  onArchive,
  onUnarchive,
}: WorkspaceTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteModalWorkspace, setDeleteModalWorkspace] =
    useState<WorkspaceTableRow | null>(null);

  const handleMenuToggle = (workspaceId: string) => {
    setOpenMenuId(openMenuId === workspaceId ? null : workspaceId);
  };

  const handleAction = (action: () => void) => {
    action();
    setOpenMenuId(null);
  };

  return (
    <>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-card/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground/60">
                  Workspace
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground/60">
                  Files
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground/60">
                  Created
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground/60">
                  Last Updated
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground/60">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-foreground/60">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {workspaces.map((workspace) => (
                <tr
                  key={workspace.id}
                  className="border-b border-border last:border-b-0 hover:bg-card/30 transition-colors cursor-pointer"
                  onClick={() => onOpen(workspace.id)}
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <FolderOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {workspace.name}
                      </p>
                      {workspace.description && (
                        <p className="text-sm text-foreground/50 truncate max-w-xs">
                          {workspace.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5 text-foreground/60">
                      <FileText className="h-4 w-4" />
                      <span>{workspace.file_count}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-foreground/60">
                    {formatDate(workspace.created_at)}
                  </td>
                  <td className="py-4 px-4 text-sm text-foreground/60">
                    {formatRelativeTime(workspace.updated_at)}
                  </td>
                  <td className="py-4 px-4">
                    <Badge
                      variant={
                        workspace.status === "active" ? "success" : "secondary"
                      }
                    >
                      {workspace.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="relative inline-block">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuToggle(workspace.id);
                        }}
                        className="p-2 rounded-lg hover:bg-border/50 transition-colors"
                      >
                        <MoreHorizontal className="h-4 w-4 text-foreground/60" />
                      </button>

                      {openMenuId === workspace.id && (
                        <div
                          className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() =>
                              handleAction(() => onOpen(workspace.id))
                            }
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-border/30 transition-colors"
                          >
                            <FolderOpen className="h-4 w-4" />
                            Open
                          </button>

                          {workspace.status === "active" ? (
                            <button
                              onClick={() =>
                                handleAction(() => onArchive(workspace.id))
                              }
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-border/30 transition-colors"
                            >
                              <Archive className="h-4 w-4" />
                              Archive
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                handleAction(() => onUnarchive(workspace.id))
                              }
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-border/30 transition-colors"
                            >
                              <RotateCcw className="h-4 w-4" />
                              UnArchive
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setOpenMenuId(null);
                              setDeleteModalWorkspace(workspace);
                            }}
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
      <ConfirmDeleteModal
        isOpen={!!deleteModalWorkspace}
        onClose={() => setDeleteModalWorkspace(null)}
        onConfirm={() => {
          if (deleteModalWorkspace) {
            onDelete(deleteModalWorkspace.id);
          }
        }}
        workspaceName={deleteModalWorkspace?.name || ""}
      />
    </>
  );
}
