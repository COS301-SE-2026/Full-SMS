"use client";

import { useState } from "react";
import { Download, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  ExportFormat,
  getAvailableExportFormats,
  OutputType,
} from "@/types/plugin";
import { pluginService, downloadBlob } from "@/services/pluginServices";
import { useToast } from "@/contexts/toastContext/ToastContext";

interface ExportButtonProps {
  executionId: string;
  outputId: string;
  outputType: OutputType;
  outputLabel: string;
}

const FORMAT_LABELS: Record<ExportFormat, string> = {
  csv: "CSV",
  json: "JSON",
  excel: "Excel",
  hdf5: "HDF5",
  png: "PNG",
  pdf: "PDF",
  svg: "SVG",
};

export default function ExportButton({
  executionId,
  outputId,
  outputType,
  outputLabel,
}: Readonly<ExportButtonProps>) {
  const [isExporting, setIsExporting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { successToast, errorToast } = useToast();
  const formats = getAvailableExportFormats(outputType);

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    setIsOpen(false);
    try {
      const blob = await pluginService.exportOutput(
        executionId,
        outputId,
        format,
      );
      let extension = format;
      if (format === "excel") {
        extension = "xlsx";
      } else if (format === "hdf5") {
        extension = "h5";
      }
      const filename = `${outputLabel.replace(/\s+/g, "_")}.${extension}`;
      downloadBlob(blob, filename);
      successToast(`Exported ${outputLabel} as ${FORMAT_LABELS[format]}`);
    } catch (error) {
      errorToast(error instanceof Error ? error.message : "Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  if (formats.length === 0) return null;

  if (formats.length === 1) {
    return (
      <Button
        variant="secondary"
        size="sm"
        onClick={() => handleExport(formats[0])}
        disabled={isExporting}
        className="h-7 px-2 text-xs"
      >
        <Download className="h-3.5 w-3.5 mr-1" />
        {isExporting ? "..." : FORMAT_LABELS[formats[0]]}
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="h-7 px-2 text-xs"
      >
        <Download className="h-3.5 w-3.5 mr-1" />
        {isExporting ? "..." : "Export"}
        <ChevronDown className="h-3 w-3 ml-1" />
      </Button>

      {isOpen && (
        <>
          <button
            type="button"
            aria-label="Close export menu"
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-20 min-w-[100px] py-1">
            {formats.map((format) => (
              <button
                key={format}
                onClick={() => handleExport(format)}
                className="block w-full px-3 py-1.5 text-left text-xs text-foreground hover:bg-muted transition-colors"
              >
                {FORMAT_LABELS[format]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
