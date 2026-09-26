"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  PluginOutput,
  ExportFormat,
  getAvailableExportFormats,
  isDataOutputType,
} from "@/types/plugin";
import { pluginService, downloadBlob } from "@/services/pluginServices";
import { useToast } from "@/contexts/toastContext/ToastContext";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  executionId: string;
  outputs: PluginOutput[];
  results: Record<string, unknown>;
  pluginName: string;
}

const FORMAT_LABELS: Record<ExportFormat, string> = {
  csv: "CSV",
  json: "JSON",
  excel: "Excel (.xlsx)",
  hdf5: "HDF5 (.h5)",
  png: "PNG",
  pdf: "PDF",
  svg: "SVG",
};

export default function ExportModal({
  isOpen,
  onClose,
  executionId,
  outputs,
  results,
  pluginName,
}: Readonly<ExportModalProps>) {
  const { successToast, errorToast } = useToast();
  const [selectedOutputs, setSelectedOutputs] = useState<Set<string>>(
    new Set(),
  );
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("json");
  const [isExporting, setIsExporting] = useState(false);

  const exportableOutputs = outputs.filter(
    (o) => o.exportable !== false && results[o.id] !== undefined,
  );

  const getFormatsForOutput = (output: PluginOutput): ExportFormat[] => {
    return getAvailableExportFormats(output.type);
  };

  const toggleOutput = (outputId: string) => {
    const newSelected = new Set(selectedOutputs);
    if (newSelected.has(outputId)) {
      newSelected.delete(outputId);
    } else {
      newSelected.add(outputId);
    }
    setSelectedOutputs(newSelected);
  };

  const selectAll = () => {
    if (selectedOutputs.size === exportableOutputs.length) {
      setSelectedOutputs(new Set());
    } else {
      setSelectedOutputs(new Set(exportableOutputs.map((o) => o.id)));
    }
  };

  const handleExport = async () => {
    if (selectedOutputs.size === 0) {
      errorToast("Please select at least one output to export");
      return;
    }

    setIsExporting(true);

    try {
      let exportedCount = 0;
      for (const outputId of selectedOutputs) {
        const output = exportableOutputs.find((o) => o.id === outputId);
        if (!output) continue;

        const formats = getFormatsForOutput(output);
        if (!formats.includes(selectedFormat)) {
          continue;
        }

        const blob = await pluginService.exportOutput(
          executionId,
          outputId,
          selectedFormat,
        );
        const extension =
          selectedFormat === "excel"
            ? "xlsx"
            : selectedFormat === "hdf5"
              ? "h5"
              : selectedFormat;
        const filename = `${pluginName.replace(/\s+/g, "_")}_${output.label.replace(/\s+/g, "_")}.${extension}`;
        downloadBlob(blob, filename);
        exportedCount++;
      }

      if (exportedCount > 0) {
        successToast(
          `Exported ${exportedCount} output(s) as ${FORMAT_LABELS[selectedFormat]}`,
        );
        onClose();
      } else {
        errorToast(
          "No outputs were exported. Selected format may not be compatible.",
        );
      }
    } catch (error) {
      errorToast(error instanceof Error ? error.message : "Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      const blob = await pluginService.exportAllOutputs(executionId, "json");
      const filename = `${pluginName.replace(/\s+/g, "_")}_all_outputs.json`;
      downloadBlob(blob, filename);
      successToast("Exported all outputs as JSON");
      onClose();
    } catch (error) {
      errorToast(error instanceof Error ? error.message : "Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal open={isOpen} onClose={onClose} title="Export Results">
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground">
              Select Outputs
            </label>
            <button
              onClick={selectAll}
              className="text-xs text-primary hover:underline"
            >
              {selectedOutputs.size === exportableOutputs.length
                ? "Deselect All"
                : "Select All"}
            </button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto border border-border rounded-lg p-2">
            {exportableOutputs.map((output) => {
              const formats = getFormatsForOutput(output);
              const isSelected = selectedOutputs.has(output.id);
              const supportsFormat = formats.includes(selectedFormat);
              const isChainable = isDataOutputType(output.type) && output.chainable !== false;

              return (
                <label
                  key={output.id}
                  className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                    isSelected ? "bg-primary/10" : "hover:bg-muted"
                  } ${!supportsFormat && selectedFormat !== "json" ? "opacity-50" : ""}`}
                >
                  <input
                    type="checkbox"
                    aria-label={`Select ${output.label}`}
                    checked={isSelected}
                    onChange={() => toggleOutput(output.id)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary/50"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-foreground truncate">
                        {output.label}
                      </p>
                      {isChainable && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded flex-shrink-0">
                          Chainable
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {output.type} •{" "}
                      {formats.map((f) => FORMAT_LABELS[f]).join(", ")}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-sm font-medium text-foreground block mb-2">
            Export Format
          </div>
          <div className="grid grid-cols-4 gap-2">
            {(["json", "csv", "excel", "hdf5"] as ExportFormat[]).map(
              (format) => (
                <button
                  key={format}
                  onClick={() => setSelectedFormat(format)}
                  className={`px-3 py-2 text-sm rounded border transition-colors ${
                    selectedFormat === format
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted text-foreground"
                  }`}
                >
                  {FORMAT_LABELS[format]}
                </button>
              ),
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Note: Not all formats support all output types. Incompatible outputs
            will be skipped.
          </p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportAll}
            disabled={isExporting}
          >
            Export All as JSON
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExport}
              disabled={isExporting || selectedOutputs.size === 0}
              leftIcon={<Download className="h-4 w-4" />}
            >
              {isExporting ? "Exporting..." : "Export Selected"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
