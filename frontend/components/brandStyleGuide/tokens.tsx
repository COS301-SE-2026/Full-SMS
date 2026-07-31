'use client'
/* eslint-disable react/no-unescaped-entities */

import React from "react";
import { Card, CardContent } from "../ui";

export default function Tokens() {
  return (
    <div className="h-screen mt-16 mb-4">
      <h2>Tokens & Imports</h2>
      <p className="text-foreground/60">
        Quick reference for everything exported by the design system.
      </p>

      <p className="mt-8">Component imports</p>
      <Card>
        <CardContent className="bg-background/90 font-mono rounded p-6">
          <div className="flex flex-col gap-2">
            <p>
              <span className="text-chart-1">import</span> &#123;
            </p>
            <p className="pl-4">
              Button, <br />
              Input,
              <br /> Toggle, <br />
              Badge, <br />
              Card, <br />
              CardHeader, <br />
              CardTitle,
              <br />
              CardDescription, <br />
              CardContent, <br />
              CardFooter, <br />
              Loader, <br />
              PageLoader
            </p>
            <p>
              &#125; <span className="text-chart-1">from</span>{" "}
              <span className="text-success">&quot;@/components/ui&quot;</span>
            </p>
          </div>
        </CardContent>
      </Card>

      <p className="mt-8">JS token imports</p>
      <Card>
        <CardContent className="bg-background/90 font-mono rounded p-6">
          <div className="flex flex-col gap-2">
            <p>
              <span className="text-chart-1">import</span> &#123; colors &#125;{" "}
              <span className="text-chart-1">from</span>{" "}
              <span className="text-success">&quot;@/lib/tokens&quot;</span>
            </p>
            <br />
            <p>
              colors.primary &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-foreground/60">-- '#00e5ff'</span>
            </p>
            <p>
              colors.background &nbsp;&nbsp;&nbsp;<span className="text-foreground/60">-- '#121212'</span>
            </p>
            <p>
              colors.card &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-foreground/60">-- '#1E1E1E'</span>
            </p>
            <p>
              colors.foreground &nbsp;&nbsp;&nbsp;<span className="text-foreground/60">-- '#e8e8e8'</span>
            </p>
            <p>
              colors.success &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-foreground/60">-- '#00e676'</span>
            </p>
            <p>
              colors.warning &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-foreground/60">-- '#ffd600'</span>
            </p>
            <p>
              colors.destructive &nbsp;&nbsp;<span className="text-foreground/60">-- '#ff1744'</span>
            </p>
            <p>
              colors.border &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-foreground/60">-- '#3a3a3a'</span>
            </p>
            <p>
              colors.chart &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-foreground/60">--[<br />
                '#440154',
                <br /> '#31688e', <br />
                '#35b779', <br />
                '#fde724', <br />
                '#21918c']
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      <p className="mt-8">CSS variables</p>
      <Card>
        <CardContent className="bg-background/90 font-mono rounded p-6">
          <div className="flex flex-col gap-2">
            <p>
              <span className="text-destructive">--color-primary</span>:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span>#00e5ff</span>;
            </p>
            <p>
              <span className="text-destructive">--color-background</span>:&nbsp;&nbsp;<span>#121212</span>;
            </p>
            <p>
              <span className="text-destructive">--color-card</span>:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span>#1E1E1E</span>;
            </p>
            <p>
              <span className="text-destructive">--color-foreground</span>:&nbsp;&nbsp;<span>#e8e8e8</span>;
            </p>
            <p>
              <span className="text-destructive">--color-success</span>:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span>#00e676</span>;
            </p>
            <p>
              <span className="text-destructive">--color-warning</span>:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span>#ffd600</span>;
            </p>
            <p>
              <span className="text-destructive">--color-destructive</span>:&nbsp;<span>#ff1744</span>;
            </p>
            <p>
              <span className="text-destructive">--color-border</span>:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span>#3a3a3a</span>;
            </p>
            <p>
              <span className="text-destructive">--font-sans</span>:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-success">'Public Sans'</span>, sans-serif;
            </p>
            <p>
              <span className="text-destructive">--font-mono</span>:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-success">'JetBrains Mono'</span>, monospace;
            </p>
          </div>
        </CardContent>
      </Card>

      <p className="mt-8">cn() class merger</p>
      <Card>
        <CardContent className="bg-background/90 font-mono rounded p-6">
          <div className="flex flex-col gap-2">
            <p>
              <span className="text-chart-1">import</span> &#123; cn &#125;{" "}
              <span className="text-chart-1">from</span>{" "}
              <span className="text-success">'@/lib/utils'</span>
            </p>
            <br />
            <p>
              &lt;<span className="text-success">div</span>{" "}
              <span className="text-destructive">className</span>=&#123;cn(
            </p>
            <p className="pl-4">
              <span className="text-success">'bg-card text-foreground'</span>,
            </p>
            <p className="pl-4">
              isActive &&{" "}
              <span className="text-success">'border border-primary'</span>,
            </p>
            <p className="pl-4">className</p>
            <p>)&#125; /&gt;</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
