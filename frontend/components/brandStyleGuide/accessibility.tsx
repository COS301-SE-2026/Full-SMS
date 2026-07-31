/* eslint-disable react/no-unescaped-entities */
import React from "react";
import { Card, CardContent, CardFooter } from "../ui";

export default function Accessibility() {
  return (
    <div className="h-full mt-16 mb-4">
      <h2>Accessibility Standards</h2>
      <p className="text-foreground/60">
        Accessibility guidelines for <span className="text-primary">Full SMS</span>
      </p>

      <p className="mt-8">Conformance & Contrast</p>
      <Card>
        <CardContent className="bg-background/90 p-6">
          <ul className="list-disc pl-5 space-y-2 text-foreground">
            <li>
              <span className="font-bold">Target:</span> WCAG 2.2 Level AA
              compliance is the strict minimum across the application
            </li>
            <li>
              <span className="font-bold">Text Contrast:</span> Normal text
              maintains a minimum contrast ratio of 4.5:1 against its
              background. Large text and essential UI components maintain a 3:1
              ratio.
            </li>
            <li>
              <span className="font-bold">Data Visualization:</span> All heatmap
              colourmaps supported by react-plotly.js are colorblind safe.
            </li>
          </ul>
        </CardContent>
      </Card>

      <p className="mt-8">Keyboard Navigation & Focus</p>
      <Card>
        <CardContent className="bg-background/90 font-mono rounded p-6">
          <div className="flex flex-col gap-2">
            <p className="font-sans text-foreground mb-4">
              All interactive elements are fully navigable via keyboard. A
              highly visible focus indicator is mandatory and standardized using
              Tailwind&apos;s ring utilities.
            </p>
            <p>
              <span className="text-foreground/60">
                Standard focus ring applied to Buttons and Inputs
              </span>
            </p>
            <p>
              &lt;<span className="text-success">button</span> 
              <span className="text-destructive">className</span>=&#123;cn(
            </p>
            <p className="pl-4 text-success">
              &apos;focus-visible:outline-none focus-visible:ring-2&apos;,
            </p>
            <p className="pl-4 text-success">
              &apos;focus-visible:ring-primary focus-visible:ring-offset-2&apos;,
            </p>
            <p className="pl-4 text-success">
              &apos;focus-visible:ring-offset-background&apos;
            </p>
            <p>)&#125;&gt;</p>
          </div>
        </CardContent>
      </Card>

      <p className="mt-8">Screen Reader Support</p>
      <Card>
        <CardContent className="bg-background/90 font-mono rounded p-6">
          <div className="flex flex-col gap-2">
            <p className="font-sans text-foreground mb-4">
              Semantic HTML is used by default. ARIA labels are required for
              icon-only buttons, complex interactive states, and dynamic data
              visualizations.
            </p>
            <p>
              <span className="text-foreground/60">
                 Example: Accessible icon button
              </span>
            </p>
            <p>
              &lt;<span className="text-success">Button</span>
            </p>
            <p className="pl-4">
              <span className="text-destructive">variant</span>= <span className="text-success">&quot;ghost&quot;</span>
            </p>
            <p className="pl-4">
              <span className="text-destructive">aria-label</span>= <span className="text-success"> &quot; Download spectrum data &quot; </span>
            </p>
            <p>&gt;</p>
            <p className="pl-4">
              &lt;<span className="text-success">Download</span> 
              <span className="text-destructive">aria-hidden</span>= <span className="text-success">"true"</span> /&gt;
            </p>
            <p>
              &lt;/<span className="text-success">Button</span>&gt;
            </p>
          </div>
        </CardContent>
      </Card>

      <p className="mt-8">Reduced Motion</p>
      <Card>
        <CardContent className="font-mono rounded p-6">
          <div className="flex flex-col gap-2">
            <p className="font-sans text-foreground mb-4">
              Animations and transitions respect the user&apos;s OS-level motion
              preferences. Animation as a whole is kept at a minimum throughout
              Full SMS
            </p>
          </div>
        </CardContent>
        <CardFooter className="m-4 flex flex-col bg-background/90 rounded">
          <p>
            <span className="text-foreground/60">
               Using Tailwind&apos;s motion-reduce variant
            </span><br/>&lt;<span className="text-success">div</span>
            <span className="text-destructive">className</span>=<span className="text-success">
              &quot;transition-all duration-300 motion-reduce:transition-none
              motion-reduce:transform-none&quot;</span>&gt;Animated Content&lt;/<span className="text-success">div</span>&gt;
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
