import React from "react";
import { Button, Card, CardContent } from "../ui";

export default function VoiceAndTone() {
  return (
    <div className="h-full mt-16 mb-4">
      <h2>Voice & Tone</h2>
      <p className="text-foreground/60">
        Guidance on writing style for UI text, ensuring interactions are clear,
        professional, and accessible.
      </p>

      <p className="mt-8">General Principles</p>
      <Card>
        <CardContent className="bg-background/90 p-6">
          <ul className="list-disc pl-5 space-y-2 text-foreground">
            <li>
              <strong>Concise:</strong> Avoid unnecessary filler words. Get
              straight to the point to reduce cognitive load.
            </li>
            <li>
              <strong>Professional, not robotic:</strong> Speak directly to the
              user with a helpful and objective tone.
            </li>
            <li>
              <strong>Scientific:</strong> This principle combines the first two. Adhering to the scientific language of the domain helps keep text concise and professional.
            </li>
          </ul>
        </CardContent>
      </Card>

      <p className="mt-8">Button Labels</p>
      <Card>
        <CardContent className="bg-background/90 font-mono rounded p-6">
          <div className="flex flex-col gap-4 text-sm text-foreground">
            <div className="flex flex-col gap-2">
              <span className="text-destructive font-bold">Avoid:</span>
                <Button>
                    Click here
                </Button>
                <Button>
                    Submit
                </Button>
            </div>
            <div className="flex flex-col gap-2 mt-4">
              <span className="text-success font-bold">Use:</span>
                <Button variant={'outline'}>
                    Upload Dataset
                </Button>
                <Button>
                    Create Workspace
                </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="mt-8">Error Messages</p>
      <Card>
        <CardContent className="bg-background/90 font-mono rounded p-6">
          <p className="font-sans text-foreground mb-4">
            Error messages should not blame a user, state what went wrong,
            and provide a direct path to resolution.
          </p>
          <div className="flex flex-col gap-4 text-sm text-foreground">
            <div className="flex flex-col gap-2">
              <span className="text-destructive font-bold">Avoid:</span>
              <span className="bg-card px-3 py-2 rounded border border-border w-full">
                You uploaded the wrong file type.
              </span>
            </div>
            <div className="flex flex-col gap-2 mt-4">
              <span className="text-success font-bold">Use:</span>
              <span className="bg-card px-3 py-2 rounded border border-border w-full">
                Please upload an hdf5/h5 file to continue.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="mt-8">Empty States</p>
      <Card>
        <CardContent className="bg-background/90 font-mono rounded p-6">
          <p className="font-sans text-foreground mb-4">
            Empty states should reassure the user that the system is working and
            guide them on what to do next.
          </p>
          <div className="flex flex-col gap-4 text-sm text-foreground">
            <div className="flex flex-col gap-2">
              <span className="text-destructive font-bold">Avoid:</span>
              <span className="bg-card px-3 py-2 rounded border border-border w-full">
                No Workspaces Found.
              </span>
            </div>
            <div className="flex flex-col gap-2 mt-4">
              <span className="text-success font-bold">Use:</span>
              <span className="bg-card px-3 py-2 rounded border border-border w-full">
                No workspaces yet. Create your first workspace to begin
                uploading and analyzing data.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
