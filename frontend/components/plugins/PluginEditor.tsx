"use client";

import { useState } from "react";
import {
  PluginEditorProps,
  PluginParameter,
  PluginOutput,
  PARAMETER_TYPE_OPTIONS,
  OUTPUT_TYPE_OPTIONS,
  ParameterType,
  OutputType,
} from "@/types/plugin";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Plus,
  Trash2,
  Code,
  Settings,
  Save,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  BookOpen,
  Lightbulb,
  Package,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { useFormik, FormikProvider } from "formik";
import * as Yup from "yup";
import CodeEditor from "./CodeEditor";
import { usePluginValidation } from "@/hooks/usePluginValidation";
import {
  DEFAULT_SCRIPT,
  DEFAULT_PARAMETERS,
  DEFAULT_OUTPUTS,
  SCRIPT_GUIDE_SECTIONS,
  SCRIPT_GUIDE_EXAMPLE,
} from "./constants";

const PluginSchema = Yup.object({
  name: Yup.string()
    .min(1, "Name is required")
    .max(100, "Name cannot exceed 100 characters")
    .required("Plugin name is required"),
  description: Yup.string().max(
    1000,
    "Description cannot exceed 1000 characters",
  ),
  version: Yup.string().max(50, "Version cannot exceed 50 characters"),
  script: Yup.string()
    .min(1, "Script is required")
    .required("Script is required"),
  parameters: Yup.array().of(
    Yup.object({
      id: Yup.string().required("Parameter ID is required"),
      label: Yup.string().required("Parameter label is required"),
      type: Yup.string().required("Parameter type is required"),
    }),
  ),
  outputs: Yup.array()
    .of(
      Yup.object({
        id: Yup.string().required("Output ID is required"),
        label: Yup.string().required("Output label is required"),
        type: Yup.string().required("Output type is required"),
      }),
    )
    .min(1, "At least one output is required"),
});

const sanitizeId = (value: string): string => {
  return value.replace(/\s+/g, "_").replace(/\W/g, "").toLowerCase();
};

function GuideSection({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
}: Readonly<{
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}>) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-muted/50 hover:bg-muted transition-colors text-left"
      >
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-foreground/60" />
        ) : (
          <ChevronRight className="h-4 w-4 text-foreground/60" />
        )}
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-foreground">{title}</span>
      </button>
      {isOpen && <div className="p-3 border-t border-border">{children}</div>}
    </div>
  );
}

function ValidationStatus({
  isValidating,
  isValid,
  errorMessage,
}: Readonly<{
  isValidating: boolean;
  isValid: boolean | null;
  errorMessage?: string;
}>) {
  if (isValidating) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
        <span className="text-muted-foreground">Validating...</span>
      </div>
    );
  }

  if (isValid === true) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
        <span className="text-green-500">Script is valid</span>
      </div>
    );
  }

  if (isValid === false) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <XCircle className="h-3.5 w-3.5 text-destructive" />
        <span className="text-destructive">
          {errorMessage || "Validation error"}
        </span>
      </div>
    );
  }

  return null;
}

export default function PluginEditor({
  plugin,
  onSave,
  onCancel,
}: Readonly<PluginEditorProps>) {
  const [activeTab, setActiveTab] = useState<"code" | "config">("code");
  const [showHelp, setShowHelp] = useState(false);
  const [currentScript, setCurrentScript] = useState(
    plugin?.script || DEFAULT_SCRIPT,
  );

  const {
    errors: validationErrors,
    isValidating,
    isValid,
  } = usePluginValidation(currentScript, 500);

  const formik = useFormik({
    initialValues: {
      name: plugin?.name || "",
      description: plugin?.description || "",
      version: plugin?.version || "1.0.0",
      script: plugin?.script || DEFAULT_SCRIPT,
      parameters: plugin?.config.parameters || DEFAULT_PARAMETERS,
      outputs: plugin?.config.outputs || DEFAULT_OUTPUTS,
    },
    validationSchema: PluginSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await onSave({
          name: values.name,
          description: values.description || undefined,
          version: values.version,
          script: values.script,
          config: {
            parameters: values.parameters,
            outputs: values.outputs,
          },
        });
      } catch (error) {
        console.error("Error saving plugin:", error);
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <FormikProvider value={formik}>
      <form onSubmit={formik.handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Plugin Name"
            placeholder="My Analysis Plugin"
            {...formik.getFieldProps("name")}
            error={
              formik.touched.name && formik.errors.name
                ? formik.errors.name
                : undefined
            }
            required
          />
          <Input
            label="Version"
            placeholder="1.0.0"
            {...formik.getFieldProps("version")}
            error={
              formik.touched.version && formik.errors.version
                ? formik.errors.version
                : undefined
            }
          />
        </div>
        <div>
          <label
            htmlFor="plugin-description"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            Description
          </label>
          <textarea
            id="plugin-description"
            placeholder="What does this plugin do?"
            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            rows={2}
            {...formik.getFieldProps("description")}
          />
        </div>
        <div className="flex gap-2 border-b border-border">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setActiveTab("code")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "code"
                ? "border-primary text-primary"
                : "border-transparent text-foreground/60 hover:text-foreground"
            }`}
          >
            <Code className="h-4 w-4" />
            Code
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setActiveTab("config")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "config"
                ? "border-primary text-primary"
                : "border-transparent text-foreground/60 hover:text-foreground"
            }`}
          >
            <Settings className="h-4 w-4" />
            Configuration
          </Button>
        </div>
        {activeTab === "code" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="block text-sm font-medium text-foreground">
                Python Script
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={<HelpCircle className="h-4 w-4" />}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowHelp(!showHelp);
                }}
              >
                {showHelp ? "Hide Guide" : "Script Guide"}
              </Button>
            </div>

            {showHelp && (
              <div className="bg-card border border-border rounded-lg p-4 space-y-3 max-h-[500px] overflow-y-auto">
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <h4 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    {SCRIPT_GUIDE_SECTIONS.quickStart.title}
                  </h4>
                  <pre className="text-xs text-foreground/80 whitespace-pre-wrap font-mono">
                    {SCRIPT_GUIDE_SECTIONS.quickStart.content}
                  </pre>
                </div>

                <GuideSection
                  title={SCRIPT_GUIDE_SECTIONS.functions.title}
                  icon={Code}
                  defaultOpen={true}
                >
                  <div className="space-y-3">
                    {SCRIPT_GUIDE_SECTIONS.functions.items.map((func) => (
                      <div key={func.name} className="text-xs">
                        <code className="text-primary font-semibold">
                          {func.name}
                        </code>
                        <p className="text-foreground/60 mt-0.5">
                          {func.description}
                        </p>
                        <pre className="mt-1 p-2 bg-background rounded text-[10px] overflow-x-auto">
                          {func.example}
                        </pre>
                      </div>
                    ))}
                  </div>
                </GuideSection>

                <GuideSection
                  title={SCRIPT_GUIDE_SECTIONS.outputFormats.title}
                  icon={BookOpen}
                >
                  <p className="text-xs text-foreground/60 mb-3">
                    {SCRIPT_GUIDE_SECTIONS.outputFormats.description}
                  </p>
                  <div className="space-y-3">
                    {SCRIPT_GUIDE_SECTIONS.outputFormats.formats.map(
                      (format) => (
                        <div
                          key={format.type}
                          className="p-2 bg-background rounded"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-primary font-semibold text-xs">
                              {format.type}
                            </span>
                          </div>
                          <p className="text-[10px] text-foreground/60 mt-1">
                            <strong>Required:</strong> {format.required}
                          </p>
                          <p className="text-[10px] text-foreground/60">
                            <strong>Optional:</strong> {format.optional}
                          </p>
                          <pre className="mt-2 p-2 bg-card border border-border rounded text-[10px] overflow-x-auto">
                            {format.example}
                          </pre>
                        </div>
                      ),
                    )}
                  </div>
                </GuideSection>

                <GuideSection
                  title={SCRIPT_GUIDE_SECTIONS.commonMistakes.title}
                  icon={AlertTriangle}
                >
                  <div className="space-y-3">
                    {SCRIPT_GUIDE_SECTIONS.commonMistakes.mistakes.map(
                      (mistake) => (
                        <div
                          key={mistake.title}
                          className="p-2 bg-background rounded border-l-2 border-destructive/50"
                        >
                          <p className="text-xs font-medium text-foreground mb-2">
                            {mistake.title}
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-[10px] text-destructive font-medium">
                                Wrong:
                              </span>
                              <pre className="mt-1 p-1.5 bg-destructive/10 rounded text-[10px] text-destructive">
                                {mistake.wrong}
                              </pre>
                            </div>
                            <div>
                              <span className="text-[10px] text-green-500 font-medium">
                                Correct:
                              </span>
                              <pre className="mt-1 p-1.5 bg-green-500/10 rounded text-[10px] text-green-500">
                                {mistake.right}
                              </pre>
                            </div>
                          </div>
                          <p className="text-[10px] text-foreground/60 mt-2">
                            {mistake.explanation}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                </GuideSection>

                {/* Example Script */}
                <GuideSection title="Complete Example" icon={Code}>
                  <pre className="p-2 bg-background rounded text-[10px] overflow-x-auto">
                    {SCRIPT_GUIDE_EXAMPLE}
                  </pre>
                </GuideSection>

                {/* Available Packages */}
                <GuideSection
                  title={SCRIPT_GUIDE_SECTIONS.packages.title}
                  icon={Package}
                >
                  <div className="flex flex-wrap gap-2">
                    {SCRIPT_GUIDE_SECTIONS.packages.list.map((pkg) => (
                      <span
                        key={pkg}
                        className="px-2 py-1 bg-primary/10 text-primary text-xs rounded"
                      >
                        {pkg}
                      </span>
                    ))}
                  </div>
                </GuideSection>
              </div>
            )}

            <ValidationStatus
              isValidating={isValidating}
              isValid={isValid}
              errorMessage={validationErrors[0]?.message}
            />

            <CodeEditor
              value={formik.values.script}
              onChange={(value) => {
                formik.setFieldValue("script", value);
                setCurrentScript(value);
              }}
              height="320px"
              validationErrors={validationErrors}
            />
          </div>
        )}
        {activeTab === "config" && (
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-foreground">
                  Parameters
                </h4>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => {
                    const newParam: PluginParameter = {
                      id: `param_${Date.now()}`,
                      label: "New Parameter",
                      type: "number",
                      default: 0,
                      required: false,
                    };
                    formik.setFieldValue("parameters", [
                      ...formik.values.parameters,
                      newParam,
                    ]);
                  }}
                >
                  Add
                </Button>
              </div>

              <p className="text-xs text-foreground/50 mb-2">
                Parameters are accessed in your script using{" "}
                <code className="text-primary">
                  get_parameter(&quot;id&quot;, default)
                </code>
              </p>

              {formik.values.parameters.length === 0 && (
                <p className="text-sm text-foreground/40 py-4 text-center">
                  No parameters. Users will not be prompted for input.
                </p>
              )}

              {formik.values.parameters.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {formik.values.parameters.map((param, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 bg-card border border-border rounded-lg"
                    >
                      <input
                        type="text"
                        value={param.id}
                        onChange={(e) =>
                          formik.setFieldValue(
                            `parameters.${index}.id`,
                            sanitizeId(e.target.value),
                          )
                        }
                        className="w-24 px-2 py-1 text-xs bg-background border border-border rounded"
                        placeholder="ID"
                      />
                      <input
                        type="text"
                        value={param.label}
                        onChange={(e) =>
                          formik.setFieldValue(
                            `parameters.${index}.label`,
                            e.target.value,
                          )
                        }
                        className="flex-1 px-2 py-1 text-sm bg-background border border-border rounded"
                        placeholder="Label"
                      />
                      <select
                        value={param.type}
                        onChange={(e) =>
                          formik.setFieldValue(
                            `parameters.${index}.type`,
                            e.target.value as ParameterType,
                          )
                        }
                        className="px-2 py-1 text-sm bg-background border border-border rounded"
                      >
                        {PARAMETER_TYPE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const updated = formik.values.parameters.filter(
                            (_, i) => i !== index,
                          );
                          formik.setFieldValue("parameters", updated);
                        }}
                        className="p-1 hover:bg-destructive/10 rounded"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 mt-8">
                <h4 className="text-sm font-medium text-foreground">Outputs</h4>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => {
                    const newOutput: PluginOutput = {
                      id: `output_${Date.now()}`,
                      label: "New Output",
                      type: "value",
                    };
                    formik.setFieldValue("outputs", [
                      ...formik.values.outputs,
                      newOutput,
                    ]);
                  }}
                >
                  Add
                </Button>
              </div>

              <p className="text-xs text-foreground/50 mb-2">
                Set outputs in your script using{" "}
                <code className="text-primary">
                  set_output(&quot;id&quot;, value)
                </code>{" "}
                - IDs must match exactly
              </p>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {formik.values.outputs.map((output, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-card border border-border rounded-lg"
                  >
                    <input
                      type="text"
                      value={output.id}
                      onChange={(e) =>
                        formik.setFieldValue(
                          `outputs.${index}.id`,
                          sanitizeId(e.target.value),
                        )
                      }
                      className="w-24 px-2 py-1 text-xs bg-background border border-border rounded"
                      placeholder="ID"
                    />
                    <input
                      type="text"
                      value={output.label}
                      onChange={(e) =>
                        formik.setFieldValue(
                          `outputs.${index}.label`,
                          e.target.value,
                        )
                      }
                      className="flex-1 px-2 py-1 text-sm bg-background border border-border rounded"
                      placeholder="Label"
                    />
                    <select
                      value={output.type}
                      onChange={(e) =>
                        formik.setFieldValue(
                          `outputs.${index}.type`,
                          e.target.value as OutputType,
                        )
                      }
                      className="px-2 py-1 text-sm bg-background border border-border rounded"
                    >
                      {OUTPUT_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const updated = formik.values.outputs.filter(
                          (_, i) => i !== index,
                        );
                        formik.setFieldValue("outputs", updated);
                      }}
                      className="p-1 hover:bg-destructive/10 rounded"
                      disabled={formik.values.outputs.length === 1}
                    >
                      <Trash2
                        className={`h-4 w-4 ${
                          formik.values.outputs.length === 1
                            ? "text-foreground/20"
                            : "text-destructive"
                        }`}
                      />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="flex justify-end gap-3 pt-4 ">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={formik.isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={formik.isSubmitting}
            leftIcon={<Save className="h-4 w-4" />}
            disabled={!formik.isValid || formik.isSubmitting}
          >
            {plugin ? "Update Plugin" : "Create Plugin"}
          </Button>
        </div>
      </form>
    </FormikProvider>
  );
}
