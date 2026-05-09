"use client";

import { useState } from "react";

type ExpandableRichTextProps = {
  html: string;
};

export function ExpandableRichText({ html }: ExpandableRichTextProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-3">
      <div className={expanded ? "" : "relative max-h-40 overflow-hidden"}>
        <div
          className="text-sm leading-6 text-muted-foreground [&_ol]:ml-5 [&_ol]:list-decimal [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:ml-5 [&_ul]:list-disc"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {!expanded ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-white/0" />
        ) : null}
      </div>
      <button
        className="mt-3 text-sm font-semibold text-primary underline-offset-4 hover:underline"
        onClick={() => setExpanded((current) => !current)}
        type="button"
      >
        {expanded ? "View less" : "View more"}
      </button>
    </div>
  );
}
