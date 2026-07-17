"use client";

import { Code, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface EmptyPluginStateProps {
  onCreatePlugin: () => void;
}

export default function EmptyPluginState({
  onCreatePlugin,
}: EmptyPluginStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10">
          <Code className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          No plugins yet
        </h2>
        <p className="text-foreground/60 mb-6">
          Create custom analysis plugins to extend the functionality of Full
          SMS. Write Python scripts that process your spectroscopy data and
          visualize results.
        </p>
        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={onCreatePlugin}
        >
          Create Your First Plugin
        </Button>
      </div>
    </div>
  );
}
