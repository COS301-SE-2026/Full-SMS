/* eslint-disable react/no-unescaped-entities */
import React, { useState } from "react";
import { Card, CardContent, CardHeader, Input, Toggle } from "../ui";

export default function Inputs() {
    const [checked, setChecked] = useState<boolean>(true)
  return (
    <div className="h-full mt-16 mb-4">
      <h2>Inputs and Toggles</h2>
      <p className="text-foreground/60">
        Form controls with built in label, helper text, error, and focus states
      </p>
      <p className="mt-8"> Default Input</p>
      <Card>
        <CardHeader>
          <Input
            label="Wavelength"
            placeholder="e.g 420 nm"
            helperText="Enter wavelength in nanomenters"
          />
        </CardHeader>
        <CardContent className="bg-background/90 font-mono">
          <div className="flex flex-col gap-2">
            <p>
              <span className="text-chart-1">import</span> &#123; Input &#125;{" "}
              <span className="text-chart-1">from</span>{" "}
              <span className="text-success">'@/components/ui'</span>
            </p>
            <p>
              &lt; Input
              <br />
              <span className="text-destructive">label</span>=<span className="text-success">Wavelength</span>
              <br />
              <span className="text-destructive">placeholder</span>=<span className="text-success">"e.g 420 nm"</span>
              <br />
              <span className="text-destructive">helperText</span>=<span className="text-success">
                "Enter wavelegth in nanometres"
              </span>
              <br />
              /&gt;
            </p>
          </div>
        </CardContent>
      </Card>
      <p className="mt-8">Error state</p>
      <Card>
        <CardHeader>
          <Input label="API key" error="Inavlid API key" />
        </CardHeader>
        <CardContent className="bg-background/90 font-mono">
          <div className="flex flex-col gap-2">
            <p>
              <span className="text-chart-1">import</span> &#123; Input &#125;{" "}
              <span className="text-chart-1">from</span>{" "}
              <span className="text-success">'@/components/ui'</span>
            </p>
            <p>
              &lt; Input
              <br />
              <span className="text-destructive">label</span>=<span className="text-success">'API key'</span>
              <br />
              <span className="text-destructive">error</span>=<span className="text-success">'Invalid API KEY'</span>
              <br />
              /&gt;
            </p>
          </div>
        </CardContent>
      </Card>

      <p className="mt-8">Error state</p>
      <Card>
        <CardHeader>
          <Input label="API key" error="Inavlid API key" />
        </CardHeader>
        <CardContent className="bg-background/90 font-mono">
          <div className="flex flex-col gap-2">
            <p>
              <span className="text-chart-1">import</span> &#123; Input &#125;{" "}
              <span className="text-chart-1">from</span>{" "}
              <span className="text-success">'@/components/ui'</span>
            </p>
            <p>
              &lt; Input
              <br />
              <span className="text-destructive">label</span>=<span className="text-success">'API key'</span>
              <br />
              <span className="text-destructive">error</span>=<span className="text-success">'Invalid API KEY'</span>
              <br />
              /&gt;
            </p>
          </div>
        </CardContent>
      </Card>
      <p className="mt-8">Toggle</p>
      <Card>
        <CardHeader>
          <Toggle
          label="Enable Notifications"
          checked={checked}
          onCheckedChange={setChecked}
          />
        </CardHeader>
        <CardContent className="bg-background/90 font-mono">
          <div className="flex flex-col gap-2">
            <p>
              <span className="text-chart-1">import</span> &#123; Toggle &#125;{" "}
              <span className="text-chart-1">from</span>{" "}
              <span className="text-success">'@/components/ui'</span>
            </p>
            <p>
              &lt; Toggle
              <br />
              <span className="text-destructive">label</span>=<span className="text-success">'Enable Notifications'</span>
              <br />
              <span className="text-destructive">checked</span>=<span className="text-success">&#123;checked&#125;</span>
                <br/>
            <span className="text-destructive">onCheckedChange</span>=<span className="text-success">&#123;setChecked&#125;</span>
              <br />
              /&gt;
            </p>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
