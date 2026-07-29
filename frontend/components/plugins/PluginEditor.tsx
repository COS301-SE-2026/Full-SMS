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
import { Plus, Trash2, Code, Settings, Save, HelpCircle } from "lucide-react";
import { useFormik, FieldArray, FormikProvider } from "formik";
import * as Yup from "yup";
import CodeEditor from "./CodeEditor";
import { DEFAULT_SCRIPT, SCRIPT_HELP_TEXT } from "./constants";

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

export default function PluginEditor({
  plugin,
  onSave,
  onCancel,
}: PluginEditorProps) {
  const [activeTab, setActiveTab] = useState<"code" | "config">("code");
  const [showHelp, setShowHelp] = useState(false);

  const formik = useFormik({
    initialValues: {
      name: plugin?.name || "",
      description: plugin?.description || "",
      version: plugin?.version || "1.0.0",
      script: plugin?.script || DEFAULT_SCRIPT,
      parameters: plugin?.config.parameters || [],
      outputs: plugin?.config.outputs || [
        { id: "result", label: "Result", type: "value" as OutputType },
      ],
    },
    validationSchema: PluginSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await onSave({
          name: values.name,
          description: values.description,
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
              <label className="block text-sm font-medium text-foreground">
                Python Script
              </label>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={<HelpCircle className="h-4.5 w-4.5" />}
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
              <div className="p-4 bg-card border border-border rounded-lg text-xs text-foreground/80 space-y-3 max-h-[400px] overflow-y-auto">
                <div>
                  <strong className="text-foreground text-sm">
                    How to Write a Plugin Script
                  </strong>
                  <p className="mt-1 text-foreground/60">
                    Your script uses predefined helper functions below all you
                    have to do is write code that uses these functions
                  </p>
                </div>

                <div>
                  <strong className="text-foreground">
                    Available Functions:
                  </strong>
                  <ul className="mt-1 space-y-1 ml-2">
                    <li>
                      <code className="text-primary">
                        get_parameter(name,default)
                      </code>
                      <span className="text-foreground/50">
                        {" "}
                        - Get a parameter value (you can use int() or float() to
                        covert)
                      </span>
                    </li>
                    <li>
                      <code className="text-primary">get_microtimes()</code>
                      <span className="text-foreground/50">
                        {" "}
                        -Returns numpy array of microtime values (ns)
                      </span>
                    </li>
                    <li>
                      <code className="text-primary">get_abstimes()</code>
                      <span className="text-foreground/50">
                        {" "}
                        - Returns numpy array of absolute arrival times (ns)
                      </span>
                    </li>
                    <li>
                      <code className="text-primary">get_data()</code>
                      <span className="text-foreground/50">
                        {" "}
                        - Returns dict with microtimes, abstimes,channel,
                        metadata
                      </span>
                    </li>
                    <li>
                      <code className="text-primary">
                        set_output(id, value)
                      </code>
                      <span className="text-foreground/50">
                        {" "}
                        - Set an output value (id must match your configured
                        outputs)
                      </span>
                    </li>
                  </ul>
                </div>

                <div>
                  <strong className="text-foreground">Example Script:</strong>
                  <pre className="mt-1 p-2 bg-background rounded text-[10px] overflow-x-auto">
                    {SCRIPT_HELP_TEXT}
                  </pre>
                </div>

                <div>
                  <strong className="text-foreground">
                    Output Formats by Type:
                  </strong>
                  <ul className="mt-1 space-y-1 ml-2">
                    <li>
                      <strong className="text-primary">histogram:</strong>{" "}
                      <code>{`{bins: [], counts: [], title?, xlabel?, ylabel?}`}</code>
                    </li>
                    <li>
                      <strong className="text-primary">plot:</strong>{" "}
                      <code>{`{x: [], y: [], title?, xlabel?, ylabel?, type?: "line"|"scatter"}`}</code>
                    </li>
                    <li>
                      <strong className="text-primary">heatmap:</strong>{" "}
                      <code>{`{values: [[]], title?, xlabel?, ylabel?, colorScale?: "viridis"|"plasma"}`}</code>
                    </li>
                    <li>
                      <strong className="text-primary">table:</strong>{" "}
                      <code>{`{columns: ["col1", "col2"], rows: [["a", 1], ["b", 2]]}`}</code>
                    </li>
                    <li>
                      <strong className="text-primary">value:</strong>{" "}
                      <code>number | string | boolean</code>
                    </li>
                  </ul>
                </div>

                <div>
                  <strong className="text-foreground">
                    Available Packages:
                  </strong>
                  <p className="mt-1">
                    <code className="text-primary">numpy</code>,{" "}
                    <code className="text-primary">scipy</code>,{" "}
                    <code className="text-primary">pandas</code>,{" "}
                    <code className="text-primary">matplotlib</code>,{" "}
                    <code className="text-primary">h5py</code>
                  </p>
                </div>
              </div>
            )}

            <CodeEditor
              value={formik.values.script}
              onChange={(value) => formik.setFieldValue("script", value)}
              height="320px"
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
                            e.target.value,
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
                          e.target.value,
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
            leftIcon={<Save className="h-4.5 w-4.5" />}
            disabled={!formik.isValid || formik.isSubmitting}
          >
            {plugin ? "Update Plugin" : "Create Plugin"}
          </Button>
        </div>
      </form>
    </FormikProvider>
  );
}
