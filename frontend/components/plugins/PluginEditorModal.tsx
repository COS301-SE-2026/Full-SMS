"use client";

import { Plugin, CreatePluginRequest } from "@/types/plugin";
import { Modal } from "@/components/ui/Modal";
import PluginEditor from "./PluginEditor";

interface PluginEditorModalProps {
  isOpen: boolean;
  plugin?: Plugin;
  onClose: () => void;
  onSave: (data: CreatePluginRequest) => Promise<void>;
}

export default function PluginEditorModal({
  isOpen,
  plugin,
  onClose,
  onSave,
}: PluginEditorModalProps) {
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={plugin ? "Edit Plugin" : "Create Plugin"}
    >
      <PluginEditor plugin={plugin} onSave={onSave} onCancel={onClose} />
    </Modal>
  );
}
