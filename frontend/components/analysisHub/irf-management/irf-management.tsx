import Sidebar from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui";
import BackButton from "@/components/ui/BackButton";
import React from "react";

export default function IrfManagement() {
  return (
    <div className="p-16 h-[vh] overflow-y-auto w-full">
      <BackButton
        className="mb-4"
      />
      <h1>IRF Management</h1>
      <Button variant={"primary"} size={"md"}>
        Upload IRF
      </Button>
    </div>
  );
}
