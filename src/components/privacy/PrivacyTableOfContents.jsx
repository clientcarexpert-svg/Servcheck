import { useState, useEffect } from "react";

const SECTIONS = [
  { id: "about", label: "About Us & This Policy" },
  { id: "collection", label: "Information We Collect" },
  { id: "how-collected", label: "How We Collect It" },
  { id: "purposes", label: "Why We Use It" },
  { id: "disclosure", label: "Who We Share With" },
  { id: "overseas", label: "Overseas Disclosure" },
  { id: "ai", label: "AI & Automated Decisions" },
  { id: "security", label: "Security & Storage" },
  { id: "cookies", label: "Cookies & Tracking" },
  { id: "rights", label: "Your Privacy Rights" },
  { id: "retention", label: "Data Retention" },
  { id: "children", label: "Children" },
  { id: "third-party", label: "Third-Party Links" },
  { id: "contact", label: "Contact Us" },
];

export default function PrivacyTableOfContents() {
  const [active, setActive] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length > 0) {
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <nav className="hidden lg:block sticky top-24 w-56 flex-shrink-0">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">On this page</p>
      <ul className="space-y-0.5">
        {SECTIONS.map(({ id, label }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={`block text-[13px] py-1 px-2.5 rounded-md transition-colors leading-snug ${
                active === id
                  ? "text-foreground font-semibold bg-secondary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}