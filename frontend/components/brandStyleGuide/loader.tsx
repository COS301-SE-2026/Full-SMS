/* eslint-disable react/no-unescaped-entities */

import React from "react";
import { Card, CardContent, CardFooter, CardHeader, Loader } from "../ui";

export default function Loaders() {
  return (
    <div className="h-screen  mt-16 mb-4">
      <h2>Loader</h2>
      <p className="text-foreground/90">
        Loader componenrs for blocking states
      </p>

      <p className="mt-8">Sizes</p>
      <Card>
        <CardHeader className="flex flex-row gap-8">
          <Loader size="sm" label="sm" />
          <Loader size="md" label="md" />
          <Loader size="lg" label="lg" />
        </CardHeader>
        <CardFooter className="bg-background/90">
          <div className="flex flex-col gap-2 font-mono">
            <p>
              <span className="text-chart-1">import</span> &#123; Loader &#125; <span className="text-chart-1">from</span> <span className="text-success">'@/components/ui'</span>
            </p>
            <p className="mt-2">
              &lt;<span className="text-success">Loader</span> <span className="text-destructive">size</span>=<span className="text-success">"sm"</span> /&gt;
            </p>
            <p>
              &lt;<span className="text-success">Loader</span> /&gt; <span className="text-foreground/60">(default)</span>
            </p>
            <p>
              &lt;<span className="text-success">Loader</span> <span className="text-destructive">size</span>=<span className="text-success">"lg"</span> /&gt;
            </p>
          </div>
        </CardFooter>
      </Card>

      <p className="mt-8">Centered in a section</p>
      <Card>
        <CardContent>
          <Loader size="lg" centered />
        </CardContent>
        <CardFooter className="font-mono bg-background/90">
          <div className="flex flex-col gap-2">
            <p>
              &lt;<span className="text-success">Loader</span> <span className="text-destructive">size</span>=<span className="text-success">"lg"</span><span className="text-destructive">centered</span> /&gt;
            </p>
          </div>
        </CardFooter>
      </Card>

      <p className="mt-8">Inline (Conditional Render)</p>
      <Card>
        <CardHeader>
          <Loader size="md" label="Fetching Results..." />
        </CardHeader>
        <CardFooter className="bg-background font-mono">
          <div className="flex flex-col gap-2">
            <p>&#123;isLoading</p>
            <p className="pl-4">
              ? &lt;<span className="text-success">Loader</span> <span className="text-destructive">size</span>=<span className="text-success">"sm"</span> /&gt;
            </p>
            <p className="pl-4">
              : &lt;<span className="text-success">YourContent</span> /&gt;
            </p>
            <p>&#125;</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
