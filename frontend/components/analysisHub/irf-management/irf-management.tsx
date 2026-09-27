"use client";

import { Button, Card } from "@/components/ui";
import BackButton from "@/components/ui/BackButton";
import { Modal } from "@/components/ui/Modal";
import FileUploadZone from "@/components/upload/FileUploadZone";
import { useHdf5Data } from "@/contexts/hdf5Context/Hdf5DataContext";
import {
  createIRFMapping,
  deleteMapping,
  getIRFMappings,
  getWorkspaceIrfs,
  uploadIrfFile,
} from "@/services/irfServices";
import React, { useEffect, useState } from "react";
import { useToast } from "@/contexts/toastContext/ToastContext";
import {
  MeasurementSummary,
  UploadMetadata,
  UploadResultRecord,
} from "@/types/hdf5";
import { getHdf5UploadResult } from "@/services/hdf5services";
import { Eraser, SaveIcon } from "lucide-react";
import { MapIRFReq } from "@/types/analysis";

function IRFField({
  label,
  value,
  IRFs = [],
  onChange,
}: {
  readonly label?: string;
  readonly value?: string;
  readonly IRFs?: any[];
  readonly onChange?: (irfId: string) => void;
}) {
  return (
    <div className="flex items-center">
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="h-7 px-2 rounded bg-card border border-border text-xs text-foreground text-right focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer"
      >
        <option value="">None</option>
        {IRFs.map((irf) => (
          <option key={irf.id} value={irf.id}>
            {irf.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function IrfManagement() {
  const IRF_EXTENSIONS = [".h5", ".hdf5", ".txt", ".dat"];
  const { currentWorkspaceId, currentUpload, setHdf5Metadata, hdf5Metadata } =
    useHdf5Data();
  const [measurementSummaries, setMeasurementSummaries] =
    useState<MeasurementSummary[]>();
  const [workspaceIRFs, setWorkspaceIRFs] = useState();
  const [irfUploadModalOpen, setIrfUploadModalOpen] = useState(false);
  const [refreshIRFs, setRefreshIRFs] = useState<boolean>(false);
  const [mappings, setMappings] = useState<Record<string, string | null>>({});
  const { successToast, infoToast, errorToast } = useToast();
  const [dbmappings, setDbmappings] = useState<MapIRFReq[]>();
  const [bulkIrfId, setBulkIrfId] = useState<string>("");

  const fetchUploadResult = async () => {
    if (currentUpload) {
      const response: UploadResultRecord =
        await getHdf5UploadResult(currentUpload);
      return response;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const record = await fetchUploadResult();
        if (record) {
          const metadata: UploadMetadata = record.metadata_json;
          setHdf5Metadata(metadata);
          setMeasurementSummaries(metadata.measurements_summary);
        }
      } catch (error) {
        console.error("Failed to fetch or parse upload result:", error);
      }
    };

    const getIrfs = async () => {
      const IRFs = await getWorkspaceIrfs(currentWorkspaceId!);
      setWorkspaceIRFs(IRFs.data);
    };

    const getMappings = async () => {
      const payload = {
        workspace_id: currentWorkspaceId,
        dataset_ref: currentUpload,
      };
      const mappings = await getIRFMappings(payload);
      if (mappings.status == "ok") {
        setDbmappings(mappings.data.data); // Just store the raw data
      }
    };

    loadData();
    getIrfs();
    getMappings();
  }, [currentUpload, currentWorkspaceId, refreshIRFs]);

  useEffect(() => {
    if (!measurementSummaries || !dbmappings) return;
    const restored: Record<string, string | null> = {};

    dbmappings.forEach((mapping) => {
      if (Number(mapping.measurement_id) === -1) {
        measurementSummaries.forEach((summ) => {
          restored[`${summ.id}:${mapping.channel}`] = mapping.irf_id || null;
        });
      }
    });

    dbmappings.forEach((mapping) => {
      if (mapping.measurement_id !== -1) {
        restored[`${mapping.measurement_id}:${mapping.channel}`] =
          mapping.irf_id || null;
      }
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMappings(restored);
  }, [measurementSummaries, dbmappings]);

  const handleIrfFilesSelected = async (files: File[]) => {
    infoToast("Uploading IRF, just a sec.");
    for (const file of files) {
      const result = await uploadIrfFile(file, currentWorkspaceId!, file.name);
      if (result.status === "ready") {
        successToast("IRF uploaded successfully");
        setIrfUploadModalOpen(false);
        setRefreshIRFs(!refreshIRFs);
      } else {
        errorToast("Unable to upload IRF, please try again later.");
      }
    }
  };

  const handleSaveMapping = async (summ: MeasurementSummary) => {
    try {
      const channels = summ.channels ?? ["channel1"];
      for (let idx = 0; idx < channels.length; idx++) {
        const channel = idx + 1;
        const key = `${summ.id}:${channel}`;
        const irfId = mappings[key];
        if (irfId) {
          await createIRFMapping({
            workspace_id: currentWorkspaceId!,
            dataset_ref: currentUpload!,
            measurement_id: Number(summ.id),
            channel,
            irf_id: irfId,
          });
        }
      }
      successToast("IRF mapping saved");
    } catch (err) {
      errorToast("Failed to save mapping");
      console.error(err);
    }
  };

  const handleApplyAll = async () => {
    if (!bulkIrfId || !measurementSummaries) return;
    infoToast("Applying IRF to all measurements and channels");
    try {
      const dualChannel = measurementSummaries.some(
        (s) => s.channels && s.channels.length > 1,
      );

      await createIRFMapping({
        workspace_id: currentWorkspaceId!,
        dataset_ref: currentUpload!,
        channel: 1,
        irf_id: bulkIrfId,
      });

      if (dualChannel) {
        await createIRFMapping({
          workspace_id: currentWorkspaceId!,
          dataset_ref: currentUpload!,
          channel: 2,
          irf_id: bulkIrfId,
        });
      }

      const updated: Record<string, string | null> = {};
      measurementSummaries.forEach((summ) => {
        (summ.channels ?? ["channel1"]).forEach((_, idx) => {
          updated[`${summ.id}:${idx + 1}`] = bulkIrfId;
        });
      });
      setMappings(updated);

      successToast("IRF applied to all measurements");
    } catch (err) {
      errorToast("Failed to apply IRF");
    }
  };

  const handleClearMapping = async (summ: MeasurementSummary) => {
    try {
      infoToast("Removing mapping.");
      const channels = summ.channels ?? ["channel1"];

      for (let idx = 0; idx < channels.length; idx++) {
        const channel = idx + 1;

        await deleteMapping({
          workspace_id: currentWorkspaceId!,
          dataset_ref: currentUpload!,
          measurement_id: Number(summ.id),
          channel,
          irf_id: "",
        });
      }

      setMappings((prev) => {
        const next = { ...prev };
        channels.forEach((_, idx) => {
          delete next[`${summ.id}:${idx + 1}`];
        });
        return next;
      });

      successToast("Mapping cleared");
    } catch (err) {
      errorToast("Failed to clear mapping");
      console.error(err);
    }
  };

  return (
    <div className="p-16 h-[vh] overflow-y-auto w-full z-11">
      <BackButton className="mb-4" />
      <h1>IRF Management</h1>
      <p className="text-lg">{hdf5Metadata?.filename}</p>
      <Modal
        open={irfUploadModalOpen}
        onClose={() => setIrfUploadModalOpen(false)}
        className=""
      >
        <div className="flex justify-start ">
          <FileUploadZone
            onFilesSelected={handleIrfFilesSelected}
            acceptedExtensions={IRF_EXTENSIONS}
            label="Drag and drop your IRF files here"
          />
        </div>
      </Modal>
      <div className="flex flex-row w-full">
        <div className="flex items-center gap-3 mt-4 w-full">
          <span className="text-sm text-foreground/60">Apply to all:</span>
          <IRFField
            value={bulkIrfId}
            IRFs={workspaceIRFs}
            onChange={(irfId) => setBulkIrfId(irfId)}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleApplyAll}
            disabled={!bulkIrfId}
          >
            Apply All
          </Button>
        </div>
        <Button
          variant={"primary"}
          size={"md"}
          onClick={() => setIrfUploadModalOpen(true)}
        >
          Upload IRF
        </Button>
      </div>
      <Card className="h-full mt-4 overflow-y-auto relative">
        <table className="w-full">
          <thead className="sticky top-0 z-10 bg-card">
            <tr className="border-b border-border bg-card/50">
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground/60">
                Measurement
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground/60">
                Channel - IRF
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground/60">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className=" overflow-y-auto z-9">
            {measurementSummaries?.map((summ) => (
              <tr
                key={summ.id}
                className="border-b border-border last:border-b-0 hover:bg-card/30 transition-colors cursor-pointer"
              >
                <td className="px-4 py-4">{summ.name}</td>
                <td className="px-4 py-4">
                  {(summ.channels ?? ["channel1"]).map((ch, idx) => {
                    const channel = idx + 1;
                    const key = `${summ.id}:${channel}`;
                    return (
                      <div key={key} className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-foreground/50">
                          Ch{channel}:
                        </span>
                        <IRFField
                          value={mappings[key] ?? ""}
                          IRFs={workspaceIRFs}
                          onChange={(irfId) =>
                            setMappings((prev) => ({
                              ...prev,
                              [key]: irfId || null,
                            }))
                          }
                        />
                      </div>
                    );
                  })}
                </td>
                <td>
                  <Button
                    variant={"secondary"}
                    className="border-0"
                    onClick={() => {
                      handleSaveMapping(summ);
                    }}
                  >
                    <SaveIcon className="text-primary" />
                  </Button>
                  <Button
                    variant={"secondary"}
                    className="border-0"
                    onClick={() => {
                      handleClearMapping(summ);
                    }}
                  >
                    <Eraser className="text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
