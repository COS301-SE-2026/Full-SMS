"use client";

import { useState } from "react";
import { FolderOpen, Archive, RotateCcw, Trash2, FileText } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { WorkspaceTableRow, WorkspaceTableProps } from "@/types/workspace";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { formatDate, formatRelativeTime } from "@/utils/dateTime";
import ActionMenu, { ActionMenuItem } from "@/components/ui/ActionMenu";
export default function WorkspaceTable({
  workspaces,
  onOpen,
  onDelete,
  onArchive,
  onUnarchive,
}: Readonly<WorkspaceTableProps>) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteModalWorkspace, setDeleteModalWorkspace] =
    useState<WorkspaceTableRow | null>(null);

  const handleAction = (action: () => void) => {
    action();
    setOpenMenuId(null);
  };

  return (
    <>
      <Card>
        <div className="overflow-x-auto overflow-y-visible">
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
                  <td className="py-4 px-4">
                    <ActionMenu
                      id={workspace.id}
                      items={[
                        {
                          label: "Open",
                          icon: <FolderOpen className="h-4 w-4" />,
                          onClick: () => onOpen(workspace.id),
                        },
                        workspace.status === "active"
                          ? {
                              label: "Archive",
                              icon: <Archive className="h-4 w-4" />,
                              onClick: () => onArchive(workspace.id),
                            }
                          : {
                              label: "UnArchive",
                              icon: <RotateCcw className="h-4 w-4" />,
                              onClick: () => onUnarchive(workspace.id),
                            },
                        {
                          label: "Delete",
                          icon: <Trash2 className="h-4 w-4" />,
                          onClick: () => setDeleteModalWorkspace(workspace),
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
      </Card>
      <ConfirmDeleteModal
        isOpen={!!deleteModalWorkspace}
        onClose={() => setDeleteModalWorkspace(null)}
        onConfirm={() => {
          if (deleteModalWorkspace) {
            onDelete(deleteModalWorkspace.id);
            setDeleteModalWorkspace(null);
          }
        }}
        workspaceName={deleteModalWorkspace?.name || ""}
      />
    </>
  );
}
