"use client";

import { Bold, Italic, List, ListOrdered } from "lucide-react";
import { useRef } from "react";

type RichTextEditorProps = {
  initialValue?: string | null;
  name: string;
  required?: boolean;
};

const commands = [
  { command: "bold", icon: Bold, label: "Bold" },
  { command: "italic", icon: Italic, label: "Italic" },
  { command: "unorderedList", icon: List, label: "Bulleted list" },
  { command: "orderedList", icon: ListOrdered, label: "Numbered list" }
] as const;

function wrapSelection(textarea: HTMLTextAreaElement, before: string, after = before) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.slice(start, end);
  const nextValue = `${textarea.value.slice(0, start)}${before}${selected || "Text"}${after}${textarea.value.slice(end)}`;

  textarea.value = nextValue;
  textarea.focus();
  textarea.selectionStart = start + before.length;
  textarea.selectionEnd = start + before.length + (selected || "Text").length;
}

function insertList(textarea: HTMLTextAreaElement, ordered = false) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.slice(start, end).trim();
  const lines = selected ? selected.split(/\n+/) : ["List item"];
  const list = lines.map((line, index) => (ordered ? `${index + 1}. ${line}` : `- ${line}`)).join("\n");
  const prefix = start > 0 && !textarea.value.slice(0, start).endsWith("\n") ? "\n" : "";
  const suffix = end < textarea.value.length && !textarea.value.slice(end).startsWith("\n") ? "\n" : "";

  textarea.value = `${textarea.value.slice(0, start)}${prefix}${list}${suffix}${textarea.value.slice(end)}`;
  textarea.focus();
  textarea.selectionStart = start + prefix.length;
  textarea.selectionEnd = start + prefix.length + list.length;
}

function editableText(value: string | null | undefined) {
  return String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li)>/gi, "\n")
    .replace(/<li>/gi, "- ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function RichTextEditor({ initialValue = "", name, required = false }: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function runCommand(command: string) {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    if (command === "bold") {
      wrapSelection(textarea, "<strong>", "</strong>");
      return;
    }

    if (command === "italic") {
      wrapSelection(textarea, "<em>", "</em>");
      return;
    }

    insertList(textarea, command === "orderedList");
  }

  return (
    <div className="overflow-hidden rounded-md border border-border bg-white">
      <div className="flex flex-wrap gap-1 border-b border-border bg-muted/40 p-2">
        {commands.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.command}
              aria-label={item.label}
              className="focus-ring inline-flex size-9 items-center justify-center rounded-md border border-border bg-white text-foreground"
              onClick={() => runCommand(item.command)}
              title={item.label}
              type="button"
            >
              <Icon size={16} />
            </button>
          );
        })}
      </div>
      <textarea
        ref={textareaRef}
        className="min-h-40 w-full resize-y border-0 bg-white px-3 py-3 text-sm leading-6 outline-none"
        defaultValue={editableText(initialValue)}
        name={name}
        required={required}
      />
    </div>
  );
}
