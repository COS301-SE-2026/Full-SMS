/* eslint-disable react/no-unescaped-entities */
import React from "react";
import { Button, Card, CardContent } from "../ui";
import { CardHeader } from "../ui";
import { ArrowRight, Download } from "lucide-react";

export default function Buttons() {
  return (
    <div className="h-full mt-16 mb-4">
      <h2>Buttons</h2>
      <p className="text-foreground/60">
        There are 5 buttom variants and 3 sizes
      </p>
      <p className="mt-8">Variants</p>
      <Card>
        <CardHeader className=" flex flex-row gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
        </CardHeader>
        <CardContent className="bg-background/90 font-mono rounded">
          <div className="flex flex-col gap-2">
            <p>
              <span className="text-chart-1">import</span>&nbsp;&#123;Button&#125;&nbsp;<span className="text-chart-1">from</span>&nbsp;<span className="str">'@/components/ui'</span>
            </p>
            <p>
              &lt;<span className="text-success">Button</span> <span>variant</span>=<span className="str">"primary"</span>&gt;Primary&lt;/<span className="text-success">Button</span>&gt;
            </p>
            <p>
              &lt;<span className="text-success">Button</span> <span>variant</span>=<span className="str">"secondary"</span>&gt;Secondary&lt;/<span className="text-success">Button</span>&gt;
            </p>
            <p>
              &lt;<span className="text-success">Button</span> <span>variant</span>=<span className="str">"outline"</span>&gt;Outline&lt;/<span className="text-success">Button</span>&gt;
            </p>

            <p>
              &lt;<span className="text-success">Button</span> <span>variant</span>=<span className="str">"ghost"</span>&gt;Ghost&lt;/<span className="text-success">Button</span>&gt;
            </p>
            <p>
              &lt;<span className="text-success">Button</span> <span>variant</span>=<span className="str">"destructive"</span>&gt;Destructive&lt;/<span className="text-success">Button</span>&gt;
            </p>
          </div>
        </CardContent>
      </Card>
      <p className="mt-8">Sizes</p>
      <Card>
        <CardHeader className="flex-row">
          <Button size="lg">
            Large
          </Button>
          <Button >
            Mid
          </Button>
          <Button size="sm">
            Small
          </Button>
        </CardHeader>
        <CardContent className="bg-background/90">
          <div className="flex flex-col gap-2">
              <p>
                <span className="text-chart-1">import</span>&nbsp;&#123;Button&#125;&nbsp;<span className="text-chart-1">from</span>&nbsp;<span className="str">'@/components/ui'</span>
              </p>
              <p>
                &lt;<span className="text-success">Button</span> <span>size</span>=<span className="str">"lg"</span>&gt;Large&lt;/<span className="text-success">Button</span>&gt;
              </p>
              <p>
                &lt;<span className="text-success">Button</span> <span>size</span>=<span className="str">"md"</span>&gt;Mid&lt;/<span className="text-success">Button</span>&gt;
              </p>
              <p>
                &lt;<span className="text-success">Button</span> <span>size</span>=<span className="str">"sm"</span>&gt;Small&lt;/<span className="text-success">Button</span>&gt;
              </p>
          </div>
        </CardContent>
      </Card>
      <p className="mt-8">States</p>
      <Card>
        <CardHeader className=" flex flex-row">
          <Button loading> Loading...</Button>
          <Button disabled> Disabled</Button>
        </CardHeader>
        <CardContent className="bg-background/90">
          <div className="flex flex-col gap-2">
              <p>
                <span className="text-chart-1">import</span>&nbsp;&#123;Button&#125;&nbsp;<span className="text-chart-1">from</span>&nbsp;<span className="str">'@/components/ui'</span>
              </p>
              <p>
                &lt;<span className="text-success">Button</span> <span>loading</span>&gt;Loading...&lt;/<span className="text-success">Button</span>&gt;
              </p>
              <p>
                &lt;<span className="text-success">Button</span> <span>disabled</span>&gt;Disabled&lt;/<span className="text-success">Button</span>&gt;
              </p>
          </div>
        </CardContent>
      </Card>

      <p className="mt-8">With Icons</p>
      <Card>
        <CardHeader className=" flex flex-row">
          <Button leftIcon={<ArrowRight/>}> Loading...</Button>
          <Button variant={"outline"} leftIcon={<Download/>}> Download</Button>
        </CardHeader> 
        <CardContent className="bg-background/90">
          <div className="flex flex-col gap-2">
              <p>
                <span className="text-chart-1">import</span>&nbsp;&#123; ArrowRight, Download &#125;&nbsp;<span className="text-chart-1">from</span>&nbsp;<span className="str">'lucide-react'</span>
              </p>
              <p>
                &lt;<span className="text-success">Button</span> <span className="text-destructive">leftIcon</span>=<span>&nbsp;&#123;&lt;<span className="text-success">ArrowRight</span>/&gt; &#125;&nbsp;</span>&gt;Continue&lt;/<span className="text-success">Button</span>&gt;
              </p>
              <p>
                &lt;<span className="text-success">Button</span> <span className="text-destructive">variant</span>=<span className="text-success">"outline"</span><span className="text-destructive"> leftIcon</span>=<span>&nbsp;&#123; &lt;<span className="text-success">Download</span>/&gt; &#125;&nbsp;</span>&gt;Download&lt;/<span className="text-success">Button</span>&gt;
              </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
