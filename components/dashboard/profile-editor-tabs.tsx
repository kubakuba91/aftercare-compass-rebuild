"use client";

import { useEffect, useState } from "react";

type ProfileEditorSection = {
  id: string;
  label: string;
};

export function ProfileEditorTabs({
  sections
}: {
  sections: ProfileEditorSection[];
}) {
  const [activeSection, setActiveSection] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    function updateActiveSection() {
      const sectionPositions = sections
        .map((section) => {
          const element = document.getElementById(section.id);
          return element ? { id: section.id, top: element.getBoundingClientRect().top } : null;
        })
        .filter(Boolean) as Array<{ id: string; top: number }>;

      const currentSection =
        sectionPositions
          .filter((section) => section.top <= 180)
          .at(-1)?.id ??
        sectionPositions.find((section) => section.top > 0)?.id ??
        sections[0]?.id;

      if (currentSection) {
        setActiveSection(currentSection);
      }
    }

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, [sections]);

  return (
    <div className="border-b border-border pb-3">
      <nav className="ac-tabs" aria-label="Profile editor sections">
        {sections.map((section) => (
          <a
            key={section.id}
            className="ac-tab"
            data-active={activeSection === section.id ? "true" : "false"}
            href={`#${section.id}`}
            onClick={() => setActiveSection(section.id)}
          >
            {section.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
