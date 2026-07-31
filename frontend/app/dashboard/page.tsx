"use client";

import { useAuth } from "@/contexts/authContext/AuthContext";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useToast } from "@/contexts/toastContext/ToastContext";
import { Loader } from "@/components/ui/Loader";
import { Card, CardContent } from "@/components/ui/Card";
import WorkspaceTable from "@/components/dashboard/WorkspaceTable";
import { WorkspaceTableRow } from "@/types/workspace";
import { WorkspaceFilterStatus } from "@/types/dashboard";
import EmptyWorkspaceState from "@/components/dashboard/EmptyWorkspaceState";
import CreateWorkspaceModal from "@/components/dashboard/CreateWorkspaceModal";
import StatusFilterButton from "@/components/ui/StatusFilterButton";
import { FolderPlus, Search } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import { workspaceService } from "@/services/workspaceServices";
import { getErrorMessage } from "@/utils/dashboard";
import { useHdf5Data } from "@/contexts/hdf5Context/Hdf5DataContext";

  async function runWorkspaceAction<T>({
    action,
    onSuccess,
    successMessage,
    errorContext,
    errorFallback,
    successToast,
    errorToast,
    setLoading,
  }: {
    action: () => Promise<T & { success: boolean }>;
    onSuccess?: (response: T) => void;
    successMessage: string;
    errorContext: string;
    errorFallback?: string;
    successToast: (message: string) => void;
    errorToast: (message: string) => void;
    setLoading: (loading: boolean) => void;
  }) {
    setLoading(true);
    try {
      const response = await action();
      if (response?.success) {
        onSuccess?.(response);
        successToast(successMessage);
      }
    } catch (error: unknown) {
      console.error(errorContext, error);
      console.error(errorFallback)
      errorToast(getErrorMessage(error, errorContext));
    } finally {
      setLoading(false);
    }
  }

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { errorToast, successToast } = useToast();

  const [workspaces, setWorkspaces] = useState<WorkspaceTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] =
    useState<WorkspaceFilterStatus>("active");
  const {setCurrentWorkspaceId} = useHdf5Data()
  const filteredWorkspaces = useMemo(() => {
    return workspaces.filter((workspace) => {
      if (statusFilter !== "all" && workspace.status !== statusFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = workspace.name.toLowerCase().includes(query);
        const matchesDescription = workspace.description
          ?.toLowerCase()
          .includes(query);
        if (!matchesName && !matchesDescription) {
          return false;
        }
      }

      return true;
    });
  }, [workspaces, statusFilter, searchQuery]);

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  const fetchWorkspaces = useCallback(async () => {
    setLoading(true);
    try {
      const response = await workspaceService.getWorkspaces();

      if (response?.success && response.workspaces) {
        setWorkspaces(response.workspaces);
      }
    } catch (error: unknown) {
      console.error("Error fetching workspaces:", error);
      const message =
        error instanceof Error
          ? error.message
          : "An error occurred while fetching workspaces.";
      errorToast(message);
    } finally {
      setLoading(false);
    }
  }, [errorToast]);

  useEffect(() => {
    let cancelled = false;
    const loadWorkspaces = async () => {
      if (!cancelled) {
        await fetchWorkspaces();
      }
    };
    loadWorkspaces();

    return () => {
      cancelled = true;
    };
  }, [fetchWorkspaces]);

  const handleOpenWorkspace = (workspaceId: string) => {
    console.log(workspaceId);
    setCurrentWorkspaceId(workspaceId)
    router.push("/workspace");
  };
  
  const handleCreateWorkspace = async (name: string, description?: string) => {
    await runWorkspaceAction({
      action: () => workspaceService.createWorkspace({ name, description }),
      onSuccess: () => {
        fetchWorkspaces();
        setIsCreateModalOpen(false);
      },
      successMessage: "Workspace created successfully",
      errorContext: "Error creating workspace:",
      errorFallback: "An error occurred while creating the workspace.",
      successToast,
      errorToast,
      setLoading,
    });
  };

  const handleDeleteWorkspace = async (workspaceId: string) => {
    await runWorkspaceAction({
      action: () =>
        workspaceService.deleteWorkspace(workspaceId, user?.id || ""),
      onSuccess: () =>
        setWorkspaces((prev) => prev.filter((w) => w.id !== workspaceId)),
      successMessage: "Workspace deleted successfully",
      errorContext: "Error deleting workspace:",
      errorFallback: "An error occurred while deleting the workspace.",
      successToast,
      errorToast,
      setLoading,
    });
  };

  const handleArchiveWorkspace = async (workspaceId: string) => {
    await runWorkspaceAction({
      action: () => workspaceService.archiveWorkspace(workspaceId),
      onSuccess: () =>
        setWorkspaces((prev) =>
          prev.map((workspace) =>
            workspace.id === workspaceId
              ? {
                  ...workspace,
                  status: "archived" as const,
                  updated_at: new Date().toISOString(),
                }
              : workspace,
          ),
        ),
      successMessage: "Workspace archived successfully",
      errorContext: "Error archiving workspace:",
      errorFallback: "An error occurred while archiving the workspace.",
      successToast,
      errorToast,
      setLoading,
    });
  };

  const handleUnarchiveWorkspace = async (workspaceId: string) => {
    await runWorkspaceAction({
      action: () => workspaceService.unarchiveWorkspace(workspaceId),
      onSuccess: () =>
        setWorkspaces((prev) =>
          prev.map((workspace) =>
            workspace.id === workspaceId
              ? {
                  ...workspace,
                  status: "active" as const,
                  updated_at: new Date().toISOString(),
                }
              : workspace,
          ),
        ),
      successMessage: "Workspace unarchived successfully",
      errorContext: "Error unarchiving workspace:",
      errorFallback: "An error occurred while unarchiving the workspace.",
      successToast,
      errorToast,
      setLoading,
    });
  };

  const hasWorkspaces = workspaces.length > 0;

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col flex-1 p-6 overflow-auto">
          <div className="flex-1 flex items-center justify-center">
           < Loader centered size="lg" label="Loading workspaces..."/>
          </div>
        </div>

      );
    }

    if (hasWorkspaces) {
      return (
        <div className="flex-1 p-6 overflow-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-foreground mb-1">
              Workspaces
            </h1>
            <p className="text-foreground/60 text-sm">
              Manage your spectroscopy analysis workspaces
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
              <input
                type="text"
                placeholder="Search workspaces..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-13 pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              />
            </div>

            <div className="flex gap-2">
              <StatusFilterButton
                label="Active"
                value="active"
                currentFilter={statusFilter}
                onClick={setStatusFilter}
                count={workspaces.filter((w) => w.status === "active").length}
              />
              <StatusFilterButton
                label="Archived"
                value="archived"
                currentFilter={statusFilter}
                onClick={setStatusFilter}
                count={workspaces.filter((w) => w.status === "archived").length}
              />
              <StatusFilterButton
                label="All"
                value="all"
                currentFilter={statusFilter}
                onClick={setStatusFilter}
                count={workspaces.length}
              />
            </div>

            <Button
              variant="primary"
              size="sm"
              leftIcon={<FolderPlus className="h-5 w-4" />}
              onClick={() => setIsCreateModalOpen(true)}
              className="ml-auto"
            >
              New Workspace
            </Button>
          </div>

          <p className="text-sm text-foreground/60 mb-4">
            Showing {filteredWorkspaces.length} of {workspaces.length}{" "}
            workspaces
          </p>

          {filteredWorkspaces.length > 0 ? (
            <WorkspaceTable
              workspaces={filteredWorkspaces}
              onOpen={handleOpenWorkspace}
              onArchive={handleArchiveWorkspace}
              onUnarchive={handleUnarchiveWorkspace}
              onDelete={handleDeleteWorkspace}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="h-12 w-12 text-foreground/20 mx-auto mb-4" />
                <p className="text-foreground/60">
                  No workspaces match your search criteria
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      );
    }

    return (
      <EmptyWorkspaceState
        onCreateWorkspace={() => setIsCreateModalOpen(true)}
      />
    );
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">{renderContent()}</main>
      <CreateWorkspaceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateWorkspace}
      />
    </div>
  );
}
