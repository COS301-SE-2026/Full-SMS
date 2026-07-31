 
import React from "react";
import { Card, CardContent } from "../ui";

export default function Changelog() {
  return (
    <div className="h-full mt-16 mb-4">
      <h2>Changelog from Demo 1</h2>
      <p className="text-foreground/60">
        Explicit breakdown of design and system changes made between Demo 1 and Demo 2.
      </p>

      <p className="mt-8">Format</p>
      <Card>
        <CardContent className="bg-background/90 p-6">
           <ul className="list-disc pl-5 space-y-2 text-foreground">
            <li>
              <strong>Change:</strong>The once static brad style guide pdf is now a live page in the Full SMS frontend.
            </li>
            <li>
              <strong>Why?</strong> A deployed design system easier access to brang guidelines for developers working on Full SMS.
            </li>
          </ul>
        </CardContent>
      </Card>

      <p className="mt-8">Expanded Component Library</p>
      <Card>
        <CardContent className="bg-background/90 p-6">
           <ul className="list-disc pl-5 space-y-2 text-foreground">
            <li>
              <strong>Change:</strong> Added visual specifications for components including Cards, Modals, and Loaders.
            </li>
            <li>
              <strong>Why?</strong> As the system progressed from wireframes to a fully functional implementation, new standardized components were required to <br/>handle more intricate interactions.
            </li>
          </ul>
        </CardContent>
      </Card>

      <p className="mt-8">Accessibility Standards Upgrade</p>
      <Card>
        <CardContent className="bg-background/90 p-6">
           <ul className="list-disc pl-5 space-y-2 text-foreground">
            <li>
              <strong>Change:</strong> Elevated the minimum accessibility conformance target from WCAG 2.1 to WCAG 2.2 AA. Added strict focus ring tokens.
            </li>
            <li>
              <strong>Why?</strong> Ensures broader inclusivity and compliance.
            </li>
          </ul>
        </CardContent>
      </Card>

    </div>
  );
}