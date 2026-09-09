import React, { Component, useState } from "react";
import { NumberField } from "../intensity-tab/analysis-toolbar";
import { Button } from "@/components/ui";


export default function CorrelationTabToolbar (){
    const [window, setWindow] = useState<number>(450)
    const [bin, setBin] = useState<number>(0)
    const [offset, setOffset] = useState<number>(0)
    return (
      <div className="flex items-center gap-4 h-12 px-4 border-b border-border bg-background flex-wrap">
        <h3 className="text-foreground">Correlation</h3>
        <NumberField label="Window (ns)" value={window} onChange={setWindow} />
        <NumberField label="Bin (ns)" value={bin} onChange={setBin}/>
        <NumberField label="Offset (ns)" value={offset} onChange={setOffset}/>
        <Button variant={"primary"} size={"sm"}>
            Correlate
        </Button>
        <Button variant={"primary"} size={"sm"}>
            Rebin
        </Button>
      </div>
    );
}

