"use client";

import { useEffect, useId, useRef, useState } from "react";

type ExpandableRichTextProps = {
  html: string;
};

export function ExpandableRichText({ html }: ExpandableRichTextProps) {
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const contentId = useId();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const content = contentRef.current;

    if (!content) {
      return;
    }

    setExpanded(false);

    const updateOverflow = () => {
      const collapsedHeight = Number.parseFloat(getComputedStyle(content).lineHeight) * 6;
      setCanExpand(content.scrollHeight > collapsedHeight + 1);
    };

    updateOverflow();
    const observer = new ResizeObserver(updateOverflow);
    observer.observe(content);

    return () => observer.disconnect();
  }, [html]);

  return (
    <div className="mt-3">
      <div className={expanded ? "" : "relative max-h-36 overflow-hidden"} id={contentId}>
        <div
          className="text-sm leading-6 text-muted-foreground [&_ol]:ml-5 [&_ol]:list-decimal [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:ml-5 [&_ul]:list-disc"
          dangerouslySetInnerHTML={{ __html: html }}
          ref={contentRef}
        />
        {!expanded && canExpand ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-white/0" />
        ) : null}
      </div>
      {canExpand ? (
        <button
          aria-controls={contentId}
          aria-expanded={expanded}
          className="mt-3 text-sm font-semibold text-primary underline-offset-4 hover:underline"
          onClick={() => setExpanded((current) => !current)}
          type="button"
        >
          {expanded ? "View less" : "View more"}
        </button>
      ) : null}
    </div>
  );
}
