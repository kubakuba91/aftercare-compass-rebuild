"use client";

import { Bold, Italic, List, ListOrdered } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

type RichTextEditorProps = {
  initialValue?: string | null;
  name: string;
  required?: boolean;
};

const commands = [
  { command: "bold", icon: Bold, label: "Bold" },
  { command: "italic", icon: Italic, label: "Italic" },
  { command: "insertUnorderedList", icon: List, label: "Bulleted list" },
  { command: "insertOrderedList", icon: ListOrdered, label: "Numbered list" }
] as const;

export function RichTextEditor({ initialValue = "", name, required = false }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const syncValue = useCallback(() => {
    if (inputRef.current && editorRef.current) {
      inputRef.current.value = editorRef.current.innerHTML;
    }
  }, []);

  useEffect(() => {
    const form = editorRef.current?.closest("form");
    if (!form) {
      return;
    }

    const syncBeforeSubmit = () => syncValue();
    const syncBeforeSubmitClick = (event: Event) => {
      const target = event.target;

      if (target instanceof HTMLButtonElement && target.type !== "button") {
        syncValue();
      }
    };
    const syncFormData = (event: Event) => {
      syncValue();
      if (inputRef.current && "formData" in event) {
        (event as FormDataEvent).formData.set(name, inputRef.current.value);
      }
    };

    form.addEventListener("click", syncBeforeSubmitClick, true);
    form.addEventListener("submit", syncBeforeSubmit);
    form.addEventListener("formdata", syncFormData);

    return () => {
      form.removeEventListener("click", syncBeforeSubmitClick, true);
      form.removeEventListener("submit", syncBeforeSubmit);
      form.removeEventListener("formdata", syncFormData);
    };
  }, [name, syncValue]);

  function runCommand(command: string) {
    editorRef.current?.focus();
    document.execCommand(command);
    syncValue();
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
      <div
        ref={editorRef}
        className="min-h-36 px-3 py-3 text-sm leading-6 outline-none [&_ol]:ml-5 [&_ol]:list-decimal [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:ml-5 [&_ul]:list-disc"
        contentEditable
        dangerouslySetInnerHTML={{ __html: initialValue || "" }}
        onBlur={syncValue}
        onInput={syncValue}
        onKeyUp={syncValue}
        onPaste={() => window.setTimeout(syncValue, 0)}
        role="textbox"
        suppressContentEditableWarning
      />
      <textarea
        ref={inputRef}
        aria-hidden="true"
        className="sr-only"
        defaultValue={initialValue || ""}
        data-required={required ? "true" : undefined}
        name={name}
        readOnly
        tabIndex={-1}
      />
    </div>
  );
}
