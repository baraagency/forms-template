import type { ReactNode } from "react";

export function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="bara-section">
      <div className="bara-section__header">
        <h2 className="bara-section__title text-balance">{title}</h2>
        {description ? (
          <p className="bara-section__description text-pretty">{description}</p>
        ) : null}
      </div>
      <div className="bara-section__body">{children}</div>
    </section>
  );
}
