"use client";

import React from "react";
import { Card, CardContent } from "../ui";

export default function Typography() {
  return (
    <div className="h-full mt-16 mb-4">
      <h2>Typography</h2>
      <p>
        Public Sans for UI text, JetBrains Mono for code and data values
        <br />
        Loaded via <span className="text-primary">next/font</span> under the OPEN FONT LICENCE
      </p>

      <p className="mt-8">Public Sans</p>
      <Card className="p-3">
        <p className="text-6xl">Public Sans</p>
      </Card>
      <p className="mt-6"> JetBrains Mono</p>
      <Card className="p-3">
        <p className="text-6xl font-mono">JetBrains Mono</p>
      </Card>

      <p className="mt-8">Type Scale</p>
      <Card>
        <CardContent>
          <table className="border-separate border-spacing-4 border-border">
            <thead>
              <tr className="">
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="">
                  <div className="flex flex-row mr-18 items-center">
                    <p>2xl&nbsp;&nbsp;&nbsp;&nbsp;</p>
                    <p>24px&nbsp;&nbsp;&nbsp;&nbsp;</p>
                    <p>500</p>
                  </div>
                </td>
                <td>
                  <h1 className="text-left text-foreground">Heading 1</h1>
                </td>
              </tr>

              <tr className="border-b border-border py-4">
                <td>
                  <div className="flex flex-row mr-18 items-center">
                    <p>xl&nbsp;&nbsp;&nbsp;&nbsp;</p>
                    <p>20px&nbsp;&nbsp;&nbsp;&nbsp;</p>
                    <p>500</p>
                  </div>
                </td>
                <td>
                  <h2 className="text-foreground">Heading 2</h2>
                </td>
              </tr>

              <tr className="border-b border-border py-4">
                <td>
                  <div className="flex flex-row mr-18 items-center">
                    <p>lg&nbsp;&nbsp;&nbsp;&nbsp;</p>
                    <p>16px&nbsp;&nbsp;&nbsp;&nbsp;</p>
                    <p>500</p>
                  </div>
                </td>
                <td>
                  <h3 className="text-foreground">Heading 3</h3>
                </td>
              </tr>

              <tr className="border-b border-border py-4">
                <td>
                  <div className="flex flex-row mr-18 items-center">
                    <p>base&nbsp;&nbsp;&nbsp;&nbsp;</p>
                    <p>14px&nbsp;&nbsp;&nbsp;&nbsp;</p>
                    <p>500</p>
                  </div>
                </td>
                <td>
                  <h4 className="text-foreground">Heading 4</h4>
                </td>
              </tr>

              <tr className="border-b border-border py-4">
                <td>
                  <div className="flex flex-row mr-18 items-center">
                    <p>base&nbsp;&nbsp;&nbsp;&nbsp;</p>
                    <p>14px&nbsp;&nbsp;&nbsp;&nbsp;</p>
                    <p>400</p>
                  </div>
                </td>
                <td>
                  <p className="text-foreground">Content and descriptions</p>
                </td>
              </tr>

              <tr className="border-b border-border py-4">
                <td>
                  <div className="flex flex-row mr-18 items-center">
                    <p>sm&nbsp;&nbsp;&nbsp;&nbsp;</p>
                    <p>12px&nbsp;&nbsp;&nbsp;&nbsp;</p>
                    <p>400</p>
                  </div>
                </td>
                <td>
                  <p className="text-foreground/60">
                    Helpers, captions and metadata
                  </p>
                </td>
              </tr>
              <tr className="border-b border-border py-4">
                <td>
                  <div className="flex flex-row mr-18 items-center">
                    <p>mono&nbsp;&nbsp;&nbsp;&nbsp;</p>
                    <p>13px&nbsp;&nbsp;&nbsp;&nbsp;</p>
                  </div>
                </td>
                <td>
                  <code className="font-mono"> <span className="text-destructive">const</span> <span className="text-primary/70">times_ms</span> = <span className="text-chart-4">mircotimes</span></code>
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
      <p className="mt-8 text-base">Usage</p>
      <Card className="p-4 flex flex-col gap-2 bg-background/90 font-mono">
        <p>&lt;h1 <span className="text-destructive/60">className</span>=<span className="text-success/90">&quot;text-2xl font-medium&quot;</span>&gt; Main Heading &lt;/h1&gt;</p>
        <p>&lt;h2 <span className="text-destructive/60">className</span>=<span className="text-success/90">&quot;text-xl font-medium&quot;</span>&gt; Section heading &lt;/h2&gt;</p>
        <p>&lt;p <span className="text-destructive/60">className</span>=<span className="text-success/90">&quot;text-base font-medium&quot;</span>&gt; Body text &lt;/p&gt;</p>
        <p>&lt;p <span className="text-destructive/60">className</span>=<span className="text-success/90">&quot;text-sm text-forground/60&quot;</span>&gt; Muted text &lt;/p&gt;</p>
        <p>&lt;code <span className="text-destructive/60">className</span>=<span className="text-success/90">&quot;font-mono&quot;</span>&gt; Time (ms) &lt;/code&gt;</p>
      </Card>
    </div>
  );
}
