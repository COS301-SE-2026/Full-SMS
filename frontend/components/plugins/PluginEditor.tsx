"use client";

import { useState } from "react";
import {
  Plugin,
  PluginEditorProps,
  PluginParameter,
  PluginOutput,
  CreatePluginRequest,
  PARAMETER_TYPE_OPTIONS,
  OUTPUT_TYPE_OPTIONS,
  ParameterType,
  OutputType,
} from "@/types/plugin";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus, Trash2, Code, Settings, Save } from "lucide-react";

const DEFAULT_SCRIPT = `def run(data, params):
    """
    Plugin entry point for custom analysis.

    Args:
        data: dict containing:
            - microtimes: Microtime (TCSPC) arrival times in nanoseconds
            - abstimes: Absolute photon arrival times in nanoseconds
            - channel: Channel number
            - metadata: File metadata dict
        params: dict with user-configured parameter values

    Returns:
        dict mapping output IDs to result values
    """
    import numpy as np

    microtimes = np.array(data['microtimes'])
    bin_width = params.get('bin_width', 0.1)

    if len(microtimes) == 0:
        return {'decay_histogram': {'bins': [], 'counts': []}}

    # Build decay histogram from microtimes
    tmin = np.min(microtimes)
    tmax = np.max(microtimes)
    bin_edges = np.arange(tmin, tmax + bin_width, bin_width)

    counts, edges = np.histogram(microtimes, bins=bin_edges)
    t = edges[:-1]

    return {
        'decay_histogram': {
            'bins': t.tolist(),
            'counts': counts.tolist(),
            'xlabel': 'Time (ns)',
            'ylabel': 'Counts',
            'title': 'Decay Histogram'
        }
    }
`;

export default function PluginEditor({
  plugin,
  onSave,
  onCancel,
}: PluginEditorProps) {
  const [name, setName] = useState(plugin?.name || "");
  const [description, setDescription] = useState(plugin?.description || "");
  const [version, setVersion] = useState(plugin?.version || "1.0.0");
  const [script, setScript] = useState(plugin?.script || DEFAULT_SCRIPT);
  const [parameters, setParameters] = useState<PluginParameter[]>(
    plugin?.config.parameters || [],
  );
  const [outputs, setOutputs] = useState<PluginOutput[]>(
    plugin?.config.outputs || [
      { id: "result", label: "Result", type: "value" },
    ],
  );
  const [activeTab, setActiveTab] = useState<"code" | "config">("code");
  const [saving, setSaving] = useState(false);

  const handleAddParameter = () => {
    const newParam: PluginParameter = {
      id: `param_${Date.now()}`,
      label: "New Parameter",
      type: "number",
      default: 0,
      required: false,
    };
    setParameters([...parameters, newParam]);
  };

  const handleUpdateParameter = (
    index: number,
    updates: Partial<PluginParameter>,
  ) => {
    const updated = [...parameters];
    updated[index] = { ...updated[index], ...updates };
    setParameters(updated);
  };

  const handleRemoveParameter = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const handleAddOutput = () => {
    const newOutput: PluginOutput = {
      id: `output_${Date.now()}`,
      label: "New Output",
      type: "value",
    };
    setOutputs([...outputs, newOutput]);
  };

  const handleUpdateOutput = (
    index: number,
    updates: Partial<PluginOutput>,
  ) => {
    const updated = [...outputs];
    updated[index] = { ...updated[index], ...updates };
    setOutputs(updated);
  };

  const handleRemoveOutput = (index: number) => {
    setOutputs(outputs.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    if (outputs.length === 0) return;

    setSaving(true);
    try {
      const data: CreatePluginRequest = {
        name: name.trim(),
        description: description.trim() || undefined,
        config: {
          parameters,
          outputs,
        },
        script,
      };
      await onSave(data);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Plugin Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Analysis Plugin"
          required
        />
        <Input
          label="Version"
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          placeholder="1.0.0"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does this plugin do?"
          className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          rows={2}
        />
      </div>

      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("code")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "code"
              ? "border-primary text-primary"
              : "border-transparent text-foreground/60 hover:text-foreground"
          }`}
        >
          <Code className="h-4 w-4" />
          Code
        </button>
        <button
          onClick={() => setActiveTab("config")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "config"
              ? "border-primary text-primary"
              : "border-transparent text-foreground/60 hover:text-foreground"
          }`}
        >
          <Settings className="h-4 w-4" />
          Configuration
        </button>
      </div>

      {activeTab === "code" ? (
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Python Script
          </label>
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            className="w-full h-64 px-4 py-3 bg-background border border-border rounded-lg text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            spellCheck={false}
          />
          <p className="text-xs text-foreground/40 mt-1">
            Define a run(data, params) function that returns a dict with output
            values.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-foreground">
                Parameters
              </h4>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Plus className="h-3 w-3" />}
                onClick={handleAddParameter}
              >
                Add
              </Button>
            </div>
            {parameters.length === 0 ? (
              <p className="text-sm text-foreground/40 py-4 text-center">
                No parameters. Users will not be prompted for input.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {parameters.map((param, index) => (
                  <div
                    key={param.id}
                    className="flex items-center gap-2 p-2 bg-card border border-border rounded-lg"
                  >
                    <input
                      type="text"
                      value={param.id}
                      onChange={(e) =>
                        handleUpdateParameter(index, { id: e.target.value })
                      }
                      className="w-24 px-2 py-1 text-xs bg-background border border-border rounded"
                      placeholder="ID"
                    />
                    <input
                      type="text"
                      value={param.label}
                      onChange={(e) =>
                        handleUpdateParameter(index, { label: e.target.value })
                      }
                      className="flex-1 px-2 py-1 text-sm bg-background border border-border rounded"
                      placeholder="Label"
                    />
                    <select
                      value={param.type}
                      onChange={(e) =>
                        handleUpdateParameter(index, {
                          type: e.target.value as ParameterType,
                        })
                      }
                      className="px-2 py-1 text-sm bg-background border border-border rounded"
                    >
                      {PARAMETER_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleRemoveParameter(index)}
                      className="p-1 hover:bg-destructive/10 rounded"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-foreground">Outputs</h4>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Plus className="h-3 w-3" />}
                onClick={handleAddOutput}
              >
                Add
              </Button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {outputs.map((output, index) => (
                <div
                  key={output.id}
                  className="flex items-center gap-2 p-2 bg-card border border-border rounded-lg"
                >
                  <input
                    type="text"
                    value={output.id}
                    onChange={(e) =>
                      handleUpdateOutput(index, { id: e.target.value })
                    }
                    className="w-24 px-2 py-1 text-xs bg-background border border-border rounded"
                    placeholder="ID"
                  />
                  <input
                    type="text"
                    value={output.label}
                    onChange={(e) =>
                      handleUpdateOutput(index, { label: e.target.value })
                    }
                    className="flex-1 px-2 py-1 text-sm bg-background border border-border rounded"
                    placeholder="Label"
                  />
                  <select
                    value={output.type}
                    onChange={(e) =>
                      handleUpdateOutput(index, {
                        type: e.target.value as OutputType,
                      })
                    }
                    className="px-2 py-1 text-sm bg-background border border-border rounded"
                  >
                    {OUTPUT_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleRemoveOutput(index)}
                    className="p-1 hover:bg-destructive/10 rounded"
                    disabled={outputs.length === 1}
                  >
                    <Trash2
                      className={`h-4 w-4 ${
                        outputs.length === 1
                          ? "text-foreground/20"
                          : "text-destructive"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          loading={saving}
          leftIcon={<Save className="h-4 w-4" />}
          disabled={!name.trim() || outputs.length === 0}
        >
          {plugin ? "Update Plugin" : "Create Plugin"}
        </Button>
      </div>
    </div>
  );
}
