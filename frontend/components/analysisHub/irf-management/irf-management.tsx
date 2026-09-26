"use client";

import { Button, Card, Checkbox } from "@/components/ui";
import BackButton from "@/components/ui/BackButton";
import { Modal } from "@/components/ui/Modal";
import FileUploadZone from "@/components/upload/FileUploadZone";
import { useHdf5Data } from "@/contexts/hdf5Context/Hdf5DataContext";
import { getWorkspaceIrfs, uploadIrfFile } from "@/services/irfServices";
import React, { useEffect, useState } from "react";
import { useToast } from "@/contexts/toastContext/ToastContext";
import {
  MeasurementSummary,
  UploadMetadata,
  UploadRecord,
  UploadResultRecord,
} from "@/types/hdf5";
import { getHdf5UploadResult } from "@/services/hdf5services";
import { Eraser, SaveIcon } from "lucide-react";

type IRF = 69 | 90 | 95 | 99;
function IRFField({
  label,
  value,
  IRFs = [],
  onChange,
}: {
  readonly label?: string;
  readonly value?: IRF;
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
		{IRFs.map((irf: any) => (
			<option key={irf.id} value={irf.id}>{irf.name}</option>
		))}
    </select>
    </div>
  );
}

export default function IrfManagement() {
  const IRF_EXTENSIONS = [".h5", ".hdf5", ".txt", ".dat"];
  const { currentWorkspaceId, currentUpload } = useHdf5Data();
  const [measurementSummaries, setMeasurementSummaries] =
    useState<MeasurementSummary[]>();
  const [workspaceIRFs, setWorkspaceIRFs] = useState();
  const [irfUploadModalOpen, setIrfUploadModalOpen] = useState(false);
  const [refreshIRFs, setRefreshIRFs] = useState<boolean>(false)
  const [mappings, setMappings] = useState<Record<string, string | null>>({});

  const { successToast, infoToast, errorToast } = useToast();

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

    loadData();
    getIrfs();
  }, [currentUpload, currentWorkspaceId, refreshIRFs]);

  const handleIrfFilesSelected = async (files: File[]) => {
    infoToast("Uploading IRF, just a sec.");
    for (const file of files) {
      const result = await uploadIrfFile(file, currentWorkspaceId!, file.name);
      if (result.status === "ready") {
        successToast("IRF uploaded successfully");
        setIrfUploadModalOpen(false);
		setRefreshIRFs(!refreshIRFs)
      } else {
        errorToast("Unable to upload IRF, please try again later.");
      }
    }
  };

  const dualChannel = (channels: string[]) => {
    return channels.length > 1;
  };

  return (
    <div className="p-16 h-[vh] overflow-y-auto w-full z-11">
      <BackButton className="mb-4" />
      <h1>IRF Management</h1>
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
      <Button
        variant={"primary"}
        size={"md"}
        onClick={() => setIrfUploadModalOpen(true)}
      >
        Upload IRF
      </Button>

      <Card className="h-full mt-4 overflow-y-auto relative">
        <table className="w-full">
          <thead className="sticky top-0 z-10 bg-card">
            <tr className="border-b border-border bg-card/50">
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground/60">
                Measurement
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground/60">
                Channels
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-foreground/60">
                IRF
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
                  {dualChannel(summ.channels!) ? (
                    <div>
                      <Checkbox
                        label={summ.channels?.[0]}
                        checked={false}
                        onCheckedChange={() => {}}
                      />
                      <Checkbox
                        label={summ.channels?.[1]}
                        checked={false}
                        onCheckedChange={() => {}}
                      />
                    </div>
                  ) : (
                    <Checkbox
                        label={"Channel 1"}
                        checked={false}
                        onCheckedChange={() => {}}
                      />
                  )}
                </td>
                <td className="px-4 py-4"><IRFField IRFs={workspaceIRFs}/></td>
				<td>
					<Button
					variant={"secondary"}
					className="border-0"
					>
						<SaveIcon className="text-primary"/>
					</Button>
					<Button
					variant={"secondary"}
					className="border-0"
					>
						<Eraser className="text-destructive"/>
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
