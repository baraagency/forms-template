export function PageTitleBlock({ text }: { text: string }) {
  return <h1 className="page-title mb-0 text-balance">{text}</h1>;
}

export function SectionHeaderBlock({ title }: { title: string }) {
  return (
    <div className="bara-section__header">
      <h2 className="bara-section__title text-balance">{title}</h2>
    </div>
  );
}

export function DividerBlock() {
  return <hr className="bara-divider" />;
}

export function TextBlock({ text }: { text: string }) {
  return <p className="whitespace-pre-line text-pretty">{text}</p>;
}
