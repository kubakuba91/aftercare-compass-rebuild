"use client";

type RichTextEditorProps = {
  initialValue?: string | null;
  name: string;
  required?: boolean;
};

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
  return (
    <textarea
      className="min-h-44 w-full resize-y rounded-md border border-border bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-primary"
      defaultValue={editableText(initialValue)}
      name={name}
      required={required}
    />
  );
}
