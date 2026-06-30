"use client";

import { useAuth } from "@/contexts/authContext/AuthContext";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/contexts/toastContext/ToastContext";
import { Loader } from "@/components/ui/Loader";
import { Card, CardContent } from "@/components/ui/Card";
import WorkspaceTable from "@/components/dashboard/WorkspaceTable";
import { WorkspaceTableRow } from "@/types/workspace";
import { WorkspaceFilterStatus } from "@/types/workspace";
import EmptyWorkspaceState from "@/components/dashboard/EmptyWorkspaceState";
import CreateWorkspaceModal from "@/components/dashboard/CreateWorkspaceModal";
import StatusFilterButton from "@/components/dashboard/StatusFilterButton";
import { Plus, Search } from "lucide-react";

const DUMMY_WORKSPACES: WorkspaceTableRow[] = [
  {
    id: "1",
    name: "Protein Folding Analysis",
    description: "Single molecule FRET analysis of protein folding dynamics",
    file_count: 12,
    status: "active",
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-06-28T14:22:00Z",
  },
  {
    id: "2",
    name: "DNA Repair Mechanisms",
    description: "Fluorescence lifetime analysis of DNA repair proteins",
    file_count: 8,
    status: "active",
    created_at: "2024-02-20T09:15:00Z",
    updated_at: "2024-06-25T11:45:00Z",
  },
  {
    id: "3",
    name: "Enzyme Kinetics Study",
    description: "Change point analysis of enzyme conformational changes",
    file_count: 5,
    status: "active",
    created_at: "2024-03-10T14:00:00Z",
    updated_at: "2024-06-20T16:30:00Z",
  },
  {
    id: "4",
    name: "Membrane Protein Dynamics",
    description: "Correlation analysis of ion channel gating",
    file_count: 15,
    status: "active",
    created_at: "2024-04-05T11:20:00Z",
    updated_at: "2024-06-15T09:10:00Z",
  },
  {
    id: "5",
    name: "Old Calibration Data",
    description: "Archived calibration measurements from 2023",
    file_count: 3,
    status: "archived",
    created_at: "2023-11-01T08:00:00Z",
    updated_at: "2024-01-10T10:00:00Z",
  },
  {
    id: "6",
    name: "Test Measurements",
    description: "Archived test data",
    file_count: 2,
    status: "archived",
    created_at: "2023-12-15T13:45:00Z",
    updated_at: "2024-02-01T15:30:00Z",
  },
];
export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { successToast, errorToast } = useToast();

  const [workspaces, setWorkspaces] = useState<WorkspaceTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] =
    useState<WorkspaceFilterStatus>("active");

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

  const fetchWorkspaces = async () => {
    setWorkspaces(DUMMY_WORKSPACES);
    setLoading(false);
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const handleOpenWorkspace = (workspaceId: string) => {
    router.push("/analysisHub");
  };

  const handleCreateWorkspace = async (name: string, description: string) => {};

  const handleDeleteWorkspace = async (workspaceId: string) => {};

  const handleArchiveWorkspace = async (workspaceId: string) => {};

  const handleUnarchiveWorkspace = async (workspaceId: string) => {};

  const handleSignOut = async () => {
    await signOut();
  };

  const hasWorkspaces = workspaces.length > 0;

  return (
    <div className="min-h-screen bg-background p-6 dark flex flex-col">
      <div className="max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-foreground mb-2">
              Workspaces
            </h1>
            <p className="text-foreground/60">
              Manage your spectroscopy analysis workspaces
            </p>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm text-foreground/60">{user?.email}</p>
            <Button variant="destructive" size="sm" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader centered size="lg" label="Loading workspaces..." />
        </div>
      ) : !hasWorkspaces ? (
        <EmptyWorkspaceState
          onCreateWorkspace={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="max-w-7xl mx-auto w-full">
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
              size="md"
              leftIcon={<Plus className="h-4 w-4" />}
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
      )}

      <CreateWorkspaceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateWorkspace}
      />
    </div>
  );
}
