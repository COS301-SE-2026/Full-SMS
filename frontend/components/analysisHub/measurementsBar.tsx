"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { UploadMetadata, UploadResultRecord } from "@/types/hdf5";
import { useHdf5Data } from "@/contexts/hdf5Context/Hdf5DataContext";
import { getHdf5UploadResult } from "@/services/hdf5services";
import { Intensity_Req } from "@/types/analysis";
import { intensityAnalysis } from "@/services/analysisServices";
import { Button, Checkbox } from "@/components/ui";

export interface MeasurementsBarProps {
  readonly showSelectionCheckboxes?: boolean;
}

export function MeasurementsBar({
  showSelectionCheckboxes = false,
}: MeasurementsBarProps) {
  const [num_measurements, setNum_measurements] = useState<number>(0);
  const {
    currentMeasurement,
    setCurrentMeasurement,
    currentUpload,
    setHdf5Data,
    setHdf5Metadata,
    hdf5Metadata,
    bin,
    selectedMeasurements,
    toggleSelectedMeasurement,
    selectAllMeasurements,
    clearSelectedMeasurements,
    toggleSelectedChannel,
    selectAllChannels,
    clearSelectedChannels,
    selectedChannels,
    isMultiChannel,
  } = useHdf5Data();

  const [shownChannels, setShownChannels] = useState<number[]>([]);

  const toggleChannelTree = (id: number) => {
    if (shownChannels.includes(id)) {
      setShownChannels(shownChannels.filter((ids) => ids !== id));
    } else {
      setShownChannels([...shownChannels, id]);
    }
  };

  const fetchUploadResult = async () => {
    if (currentUpload) {
      const response: UploadResultRecord =
        await getHdf5UploadResult(currentUpload);
      return response;
    }
  };

  const fetchIntensityTrace = async () => {
    if (currentUpload) {
      const request: Intensity_Req = {
        upload_id: currentUpload,
        measurement_id: currentMeasurement,
        bin_size_ms: Number(bin),
      };
      const response = await intensityAnalysis(request);
      setHdf5Data(response);
    }
  };

  useEffect(() => {
    fetchIntensityTrace();
  }, [currentMeasurement, bin, currentUpload]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const record = await fetchUploadResult();
        if (record) {
          const metadata: UploadMetadata = record.metadata_json;
          setNum_measurements(metadata.num_measurements);
          setHdf5Metadata(metadata);
          console.log(metadata);
        }
      } catch (error) {
        console.error("Failed to fetch or parse upload result:", error);
      }
    };

    loadData();
  }, [currentUpload]);

  useEffect(() => {
    console.log(currentMeasurement);
  }, [currentMeasurement]);
  const onClickMeasurement = (id: number) => {
    // toggleChannelTree(id)
    setCurrentMeasurement(id.toString());
  };

  useEffect(() => {
    console.log(selectedChannels);
  }, [selectedChannels]);

  return (
    <div className="flex flex-col border-t border-border overflow-hidden">
      <span className=" relative text-xs w-[15vw] text-foreground/60 tracking-wider bg-background p-3">
        MEASUREMENTS
      </span>
      <div className="overflow-hidden">
        <div className="flex items-center justify-around w-full">
          {!isMultiChannel ? (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={num_measurements === 0}
                onClick={() => {
                  selectAllMeasurements(num_measurements);
                }}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={num_measurements === 0}
                onClick={clearSelectedMeasurements}
              >
                Clear
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={num_measurements === 0}
                onClick={() => {
                  selectAllChannels();
                }}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={num_measurements === 0}
                onClick={clearSelectedChannels}
              >
                Clear
              </Button>
            </>
          )}
        </div>

        <div className="flex flex-col mt-1 overflow-y-auto flex-1">
          {hdf5Metadata?.measurements_summary?.map((m) => {
            const measurementID = m.id.toString();
            const currentM = measurementID === currentMeasurement;
            const showSelectionCheckboxes = !isMultiChannel;
            const showChannelSelectionCheckboxes = isMultiChannel;
            const MultiSelected = selectedMeasurements.has(measurementID);
            const isOpen = shownChannels.includes(m.id);

            const channelIcon = 
            isMultiChannel 
            ? (isOpen ? (<ChevronDown size={12} className="text-primary" />) : (<ChevronRight size={12} className="hover:text-primary" />)) 
            : null;

            return (
              <div
                key={m.name}
                className={cn(
                  "flex flex-col items-start px-3.5 py-1",
                  currentM ? "bg-card" : "",
                )}
              >
                <span className="flex flex-col items-center gap-1.5 px-3.5 py-1">
                  <div className="flex flex-row">
                    {showSelectionCheckboxes && (
                      <Checkbox
                        checked={MultiSelected}
                        onCheckedChange={() =>
                          toggleSelectedMeasurement(measurementID)
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="mr-2"
                      />
                    )}
                    <button
                      onClick={() => toggleChannelTree(m.id)}
                      className=""
                    >
                      {channelIcon}
                    </button>
                    <button
                      className={cn(
                        "text-xs truncate h-full w-full cursor-pointer",
                        currentM ? "text-primary" : "text-foreground",
                      )}
                      onClick={() => onClickMeasurement(m.id)}
                    >
                      {m.name}
                    </button>
                  </div>
                </span>
                {isOpen && isMultiChannel && (
                  <div className="flex flex-col pl-7 pr-3 py-1 ml-3 my-0.5 border-l-2 border-primary/30 gap-0.5 transition-all duration-200 ease-in-out transform origin-top">
                    {m.channels!.map((channelName, chIdx) => {
                      // const channelNum = chIdx + 1;
                      const channelKey = `${m.id}:${chIdx + 1}`;
                      const channelSelected = selectedChannels.has(channelKey);
                      return (
                        <button
                          key={channelName}
                          onClick={() => {
                            //setCurrentChannel(channelNum)
                          }}
                          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-foreground/80 hover:bg-card text-left transition-colors cursor-pointer"
                        >
                          {showChannelSelectionCheckboxes && (
                            <Checkbox
                              checked={channelSelected}
                              onCheckedChange={() =>
                                toggleSelectedChannel(channelKey)
                              }
                              onClick={(e) => e.stopPropagation()}
                              className="mr-2"
                            />
                          )}
                          <span className="truncate">{channelName}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {num_measurements > 0 && (
          <p className="px-3.5 py-1.5 text-[11px] text-foreground/50">
            {selectedMeasurements.size} selected
          </p>
        )}
      </div>
    </div>
  );
}
