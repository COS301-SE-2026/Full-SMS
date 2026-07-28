"use client";

import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  height?: string;
  readOnly?: boolean;
}

export default function CodeEditor({
  value,
  onChange,
  language = "python",
  height = "320px",
  readOnly = false,
}: Readonly<CodeEditorProps>) {
  return (
    <div className="rounded-lg overflow-hidden border border-border">
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={(val) => onChange(val ?? "")}
        theme="vs-dark"
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 4,
          insertSpaces: true,
          wordWrap: "on",
          folding: true,
          renderLineHighlight: "line",
          scrollbar: {
            vertical: "auto",
            horizontal: "auto",
          },
          padding: { top: 8, bottom: 8 },
        }}
      />
    </div>
  );
}
