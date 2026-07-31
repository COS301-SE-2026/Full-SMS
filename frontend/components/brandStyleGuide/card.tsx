/* eslint-disable react/no-unescaped-entities */
import React from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui";

export default function Cards() {
  return (
    <div className="h-screen mt-16 mb-4">
      <h2 className="mt-8">Card</h2>
      <p className="text-foreground/60">
        An elevated content container made up of sub-containers
      </p>
      <p className="mt-8">Full Card</p>
      <Card>
        <CardContent>
          <Card>
            <CardHeader>
              <CardTitle>Spectrum Analysis</CardTitle>
              <CardDescription>Last updated 2 minutes ago</CardDescription>
            </CardHeader>
            <CardContent className="bg-background/90 m-4 rounded-sm font-mono">
              <p>
                <span className="text-primary">intensity:</span> 1738.0
              </p>
              <p>
                <span className="text-primary">wavelegth:</span> 16
              </p>
              <p>
                <span className="text-primary">status:</span> normal
              </p>
            </CardContent>
            <CardFooter className="justify-between">
              <Badge variant="success">Active</Badge>
              <Button variant="outline" size="sm">
                View details
              </Button>
            </CardFooter>
          </Card>
        </CardContent>
        <CardFooter className="bg-background/90 font-mono">
          <div className="flex flex-col gap-2">
            <p>
              <span className="text-chart-1">import</span> &#123; Card, <br/>CardHeader, <br/>CardTitle, <br/>CardDescription, <br/>CardContent, <br/>CardFooter &#125; <span className="text-chart-1">from</span> <span className="text-success">'@/components/ui'</span>
            </p>
            <p className="mt-2">
              &lt;<span className="text-success">Card</span>&gt;
            </p>
            <p className="pl-4">
              &lt;<span className="text-success">CardHeader</span>&gt;
            </p>
            <p className="pl-8">
              &lt;<span className="text-success">CardTitle</span>&gt;Spectrum Analysis&lt;/<span className="text-success">CardTitle</span>&gt;
            </p>
            <p className="pl-8">
              &lt;<span className="text-success">CardDescription</span>&gt;Last updated 2 minutes ago&lt;/<span className="text-success">CardDescription</span>&gt;
            </p>
            <p className="pl-4">
              &lt;/<span className="text-success">CardHeader</span>&gt;
            </p>
            <p className="pl-4">
              &lt;<span className="text-success">CardContent</span>&gt;<span className="text-foreground/60"> &#123;/* content */&#125; </span>&lt;/<span className="text-success">CardContent</span>&gt;
            </p>
            <p className="pl-4">
              &lt;<span className="text-success">CardFooter</span>&gt;
            </p>
            <p className="pl-8">
              &lt;<span className="text-success">Badge</span> <span className="text-destructive">variant</span>=<span className="text-success">"success"</span>&gt;Active&lt;/<span className="text-success">Badge</span>&gt;
            </p>
            <p className="pl-8">
              &lt;<span className="text-success">Button</span> <span className="text-destructive">variant</span>=<span className="text-success">"outline"</span> <span className="text-destructive">size</span>=<span className="text-success">"sm"</span>&gt;View detail&lt;/<span className="text-success">Button</span>&gt;
            </p>
            <p className="pl-4">
              &lt;/<span className="text-success">CardFooter</span>&gt;
            </p>
            <p>
              &lt;/<span className="text-success">Card</span>&gt;
            </p>
          </div>
        </CardFooter>
      </Card>

      <p className="mt-8"></p>
    </div>
  );
}
