import React from "react";
import { Card, CardContent } from "../ui";

export default function Changelog() {
  return (
    <div className="h-full mt-16 mb-4">
      <h2>Changelog from Demo 1</h2>
      <p className="text-foreground/60">
        Explicit breakdown of design and system changes made between Demo 1 and Demo 2.
      </p>

      <p className="mt-8">Format & Delivery</p>
      <Card>
        <CardContent className="bg-background/90 p-6">
           <ul className="list-disc pl-5 space-y-2 text-foreground">
            <li>
              <strong>Change:</strong> Transitioned from a static PDF document to a living, interactive web page deployed alongside the Full SMS Next.js application.
            </li>
            <li>
              <strong>Why?</strong> A deployed design system ensures the style guide remains the single source of truth, allows for real-time interaction with UI components, and prevents drift from the actual production environment.
            </li>
          </ul>
        </CardContent>
      </Card>

      <p className="mt-8">Expanded Component Library</p>
      <Card>
        <CardContent className="bg-background/90 p-6">
           <ul className="list-disc pl-5 space-y-2 text-foreground">
            <li>
              <strong>Change:</strong> Added comprehensive visual specifications for functional application components including Cards, Modals, and Loaders.
            </li>
            <li>
              <strong>Why?</strong> As the system progressed from wireframes to a fully functional implementation, new standardized components were required to handle complex interactions like data uploads, analytical rendering, and workspace management.
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