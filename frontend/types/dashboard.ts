export interface EmptyWorkspaceStateProps {
  onCreateWorkspace: () => void;
}

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  workspaceName: string;
}

export interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description?: string) => void;
}

export interface StatusFilterButtonProps<T extends string> {
  label: string;
  value: T;
  currentFilter: T;
  onClick: (value: T) => void;
  count: number;
}
export type WorkspaceFilterStatus = "all" | "active" | "archived";

export interface DashboardSidebarProps {
  activeItem?: string;
}

export interface NavItem {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  key: string;
  onClick: () => void;
}
