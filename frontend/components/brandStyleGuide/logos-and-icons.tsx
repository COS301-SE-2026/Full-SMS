import React from "react";
import { Card, CardContent, CardFooter } from "../ui";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
} from "lucide-react";

export default function LogosAndIcons() {
  return (
    <div className="h-full mt-16 mb-4">
      <h2>Logo & Iconography</h2>
      <p className="text-foreground/60">
        Brand identity assets, clear-space rules, and UI iconography guidelines
        using Lucide React.
      </p>

      <p className="mt-8">Logo Variants</p>
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-8">
            <div className="flex flex-col gap-4">
              <h3 className="text-foreground font-medium">Full Logo</h3>
              <div className="flex items-center justify-center p-6 border border-border rounded bg-card">
                <span className="font-mono text-xl font-bold text-primary">
                  Full SMS
                </span>
              </div>
              <p className="text-sm text-foreground/60">
                The main text based logo. Used for navs and headers
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <h3 className="text-foreground font-medium">Monogram</h3>
              <div className="flex items-center justify-center p-6 border border-border rounded bg-card">
                <span className="font-mono text-xl font-bold text-primary">
                  FS
                </span>
              </div>
              <p className="text-sm text-foreground/60">
                For smaller screens
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <h3 className="text-foreground font-medium">Monochrome</h3>
              <div className="flex items-center justify-center p-6 border border-border rounded bg-foreground text-background">
                <span className="font-mono text-xl font-bold">Full SMS</span>
              </div>
              <p className="text-sm text-foreground/60">
                For high-contrast scenarios.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <h3 className="text-foreground font-medium">Inverse</h3>
              <div className="flex items-center justify-center p-6 border border-border rounded bg-primary text-background">
                <span className="font-mono text-xl font-bold">Full SMS</span>
              </div>
              <p className="text-sm text-foreground/60">
                For solid primary-colored backgrounds to maintain
                visibility.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="mt-8">Clear Space & Minimum Size</p>
      <Card>
        <CardContent className="p-6">
          <ul className="list-disc pl-5 space-y-2 text-foreground">
            <li>
              <span className="font-bold">Clear Space:</span> The minimum clear space around the
              logo must be equal to the height of the "S" in the logo mark. No
              other graphical elements or text should enter this zone.
            </li>
            <li>
              <span className="font-bold">Minimum Size (Full):</span> The full logo must never be
              rendered smaller than <span className="font-bold">80px</span> in width to maintain
              legibility of the text.
            </li>
            <li>
              <span className="font-bold">Minimum Size (Monogram):</span> The monogram must never
              be rendered smaller than <span className="font-bold">24px</span> by{" "}
              <span className="font-bold">24px</span>.
            </li>
          </ul>
        </CardContent>
      </Card>

      <p className="mt-8">Logo Do Nots</p>
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-4 text-foreground text-sm">
            <div className="flex items-center gap-2">
              <XCircle className="text-destructive w-4 h-4" />{" "}
              <span>Do not stretch, skew, or distort the proportions.</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="text-destructive w-4 h-4" />{" "}
              <span>Do not apply drop shadows or glow effects.</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="text-destructive w-4 h-4" />{" "}
              <span>Do not alter the letter-spacing or typeface.</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="text-destructive w-4 h-4" />{" "}
              <span>Do not make 'SMS' lower case or mixed case</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="text-destructive w-4 h-4" />{" "}
              <span>Do not recolor outside the approved brand palette.</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="text-destructive w-4 h-4" />{" "}
              <span>Do not place over complex, low-contrast imagery.</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="text-destructive w-4 h-4" />{" "}
              <span>Do not rotate the logo to any angle.</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="mt-8">Icon Rules - Lucide React</p>
      <Card>
        <CardContent className=" p-6">
          <div className="flex gap-4 mb-6 text-foreground">
            <Activity />
            <Info />
            <CheckCircle2 />
            <AlertTriangle />
            <XCircle />
          </div>
          <ul className="list-disc pl-5 space-y-2 text-foreground mb-6">
            <li>
              <span className="font-bold">Library:</span> Lucide React is the exclusive icon
              library for the system. Do not mix with FontAwesome, Heroicons, or
              Material Symbols.
            </li>
            <li>
              <span className="font-bold">Standard Size:</span> The default size for standard UI
              icons is <span className="font-bold">20px</span>. For dense tables or secondary
              metadata, use <span className="font-bold">16px</span>.
            </li>
            <li>
              <span className="font-bold">Stroke Weight:</span> All icons must maintain a
              consistent <span className="font-bold">stroke-width of 2</span> to match the
              geometric weight of the Public Sans font.
            </li>
          </ul>
        </CardContent>
          <CardFooter className="m-4 bg-background/90 font-mono rounded p-4 border border-border">
            <div className="flex flex-col gap-2">
              <p>
                <span className="text-foreground/60">
                  // Standard icon implementation
                </span>
              </p>
              <p>
                <span className="text-chart-1">import</span> &#123; Activity
                &#125; <span className="text-chart-1">from</span>{" "}
                <span className="text-success">'lucide-react'</span>
              </p>
              <br />
              <p>
                &lt;<span className="text-success">Activity</span>{" "}
                <span className="text-destructive">size</span>=&#123;
                <span className="text-primary">20</span>&#125;{" "}
                <span className="text-destructive">strokeWidth</span>=&#123;
                <span className="text-primary">2</span>&#125; /&gt;
              </p>
            </div>
          </CardFooter>
      </Card>
    </div>
  );
}
