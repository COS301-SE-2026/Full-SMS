"use client";

import { useRef, useEffect } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { ValidationError } from "@/types/plugin";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  height?: string;
  readOnly?: boolean;
  validationErrors?: ValidationError[];
}

export default function CodeEditor({
  value,
  onChange,
  language = "python",
  height = "320px",
  readOnly = false,
  validationErrors = [],
}: Readonly<CodeEditorProps>) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null);

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const model = editorRef.current.getModel();
    if (!model) return;

    const monaco = monacoRef.current;

    const markers: editor.IMarkerData[] = validationErrors.map((error) => {
      const lineContent = model.getLineContent(error.line) || "";
      const lineLength = lineContent.length;

      return {
        severity:
          error.severity === "error"
            ? monaco.MarkerSeverity.Error
            : monaco.MarkerSeverity.Warning,
        message: error.message,
        startLineNumber: error.line,
        startColumn: 1,
        endLineNumber: error.line,
        endColumn: lineLength + 1,
      };
    });

    monaco.editor.setModelMarkers(model, "plugin-validation", markers);

    return () => {
      if (model && monacoRef.current) {
        monacoRef.current.editor.setModelMarkers(
          model,
          "plugin-validation",
          [],
        );
      }
    };
  }, [validationErrors]);

  return (
    <div
      className="rounded-lg border border-border relative"
      style={{ overflow: "visible" }}
    >
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={(val) => onChange(val ?? "")}
        onMount={handleEditorMount}
        theme="vs-dark"
        loading={
          <div className="flex items-center justify-center h-full bg-[#1e1e1e]">
            <span className="text-foreground/40 text-sm">
              Loading editor...
            </span>
          </div>
        }
        options={{
          readOnly,
          minimap: { enabled: false },
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,

          tabSize: 4,
          insertSpaces: true,
          detectIndentation: false,

          autoIndent: "full",
          formatOnPaste: true,
          formatOnType: true,

          autoClosingBrackets: "always",
          autoClosingQuotes: "always",
          autoSurround: "languageDefined",
          bracketPairColorization: { enabled: true },
          matchBrackets: "always",

          guides: {
            indentation: true,
            bracketPairs: true,
            highlightActiveIndentation: true,
          },

          quickSuggestions: true,
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: "on",

          wordWrap: "on",
          folding: true,
          foldingHighlight: true,
          renderLineHighlight: "all",
          renderWhitespace: "selection",

          scrollbar: {
            vertical: "auto",
            horizontal: "auto",
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
          },
          padding: { top: 24, bottom: 8 },

          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          smoothScrolling: true,

          find: {
            addExtraSpaceOnTop: false,
            autoFindInSelection: "multiline",
          },

          glyphMargin: true,
        }}
      />
    </div>
  );
}
