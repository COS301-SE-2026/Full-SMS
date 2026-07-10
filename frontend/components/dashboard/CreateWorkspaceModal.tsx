"use client";

import { useFormik } from "formik";
import * as Yup from "yup";
import { FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { CreateWorkspaceModalProps } from "@/types/dashboard";

const CreateWorkspaceSchema = Yup.object({
  name: Yup.string()
    .min(3, "Workspace name must be at least 3 characters")
    .max(255, "Workspace name cannot exceed 255 characters")
    .required("Workspace name is required"),
  description: Yup.string().max(
    200,
    "Workspace description cannot exceed 200 characters",
  ),
});

export default function CreateWorkspaceModal({
  isOpen,
  onClose,
  onCreate,
}: Readonly<CreateWorkspaceModalProps>) {
  const formik = useFormik({
    initialValues: {
      name: "",
      description: "",
    },
    validationSchema: CreateWorkspaceSchema,
    onSubmit: (values, { setSubmitting, resetForm }) => {
      try {
        onCreate(values.name?.trim(), values.description?.trim() || undefined);
        resetForm();
      } catch (error: any) {
        console.error("Error creating workspace:", error);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  return (
    <Modal open={isOpen} onClose={handleClose} title="Create New Workspace">
      <form onSubmit={formik.handleSubmit} className="space-y-4">
        <Input
          label="Workspace Name"
          type="text"
          placeholder="e.g Protein Analysis Q1 2026"
          {...formik.getFieldProps("name")}
          error={
            formik.errors.name && formik.touched.name
              ? formik.errors.name
              : undefined
          }
        />

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            Workspace Description
            <span className="text-foreground/40">(optional)</span>
          </label>
          <textarea
            id="description"
            placeholder="e.g This workspace contains protein analysis results for Q1 2026."
            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors resize-none"
            {...formik.getFieldProps("description")}
          />
          {formik.errors.description && formik.touched.description && (
            <p className="mt-1 text-sm text-destructive">
              {formik.errors.description}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={formik.isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={formik.isSubmitting}
            leftIcon={<FolderPlus className="w-4 h-4" />}
            size="md"
          >
            Create Workspace
          </Button>
        </div>
      </form>
    </Modal>
  );
}
