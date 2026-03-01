"use client";

import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { EditorView } from "@codemirror/view";

const darkTheme = EditorView.theme({
  "&": { backgroundColor: "#09090b", color: "#e4e4e7" },
  ".cm-gutters": { backgroundColor: "#09090b", color: "#52525b", borderRight: "1px solid #27272a" },
  ".cm-activeLineGutter": { backgroundColor: "transparent" },
  ".cm-cursor": { borderLeftColor: "#e4e4e7" },
}, { dark: true });

export default function Editor({ content }: { content: string }) {
  return (
    <CodeMirror
      value={content}
      theme="dark"
      extensions={[markdown(), EditorView.lineWrapping, EditorView.editable.of(false), darkTheme]}
      basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: false }}
      className="h-full text-sm"
    />
  );
}
