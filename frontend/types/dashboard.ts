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

export interface StatusFilterButtonProps {
  label: string;
  value: WorkspaceFilterStatus;
  currentFilter: WorkspaceFilterStatus;
  onClick: (value: WorkspaceFilterStatus) => void;
  count: number;
}
