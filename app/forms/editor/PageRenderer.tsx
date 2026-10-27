import { useMemo } from "react";
import { FieldBlock } from "./blocks/FieldBlock";
import {
  DividerBlock,
  PageTitleBlock,
  SectionHeaderBlock,
  TextBlock,
} from "./blocks/StaticBlocks";
import { collectPageFields } from "./formPageData";
import { getVisiblePageFields } from "./formPageVisibility";
import { useFormRuntime } from "./FormRuntime";
import type { FieldBlockProps, FormPageData } from "./formPageTypes";

/** Renders a published page without importing Puck. */
export function PageRenderer({ document }: { document: FormPageData }) {
  const runtime = useFormRuntime();
  const runtimeValues = runtime?.values;
  const visibleFieldIds = useMemo(() => {
    if (!runtimeValues) {
      return null;
    }
    return new Set(
      getVisiblePageFields(collectPageFields(document), runtimeValues).map(
        (field) => field.id,
      ),
    );
  }, [document, runtimeValues]);

  return (
    <div className="space-y-4">
      {document.content.map((block) => {
        const id = block.props.id;

        switch (block.type) {
          case "PageTitle":
            return (
              <PageTitleBlock key={id} text={String(block.props.text ?? "")} />
            );
          case "SectionHeader":
            return (
              <SectionHeaderBlock
                key={id}
                title={String(block.props.title ?? "")}
              />
            );
          case "Divider":
            return <DividerBlock key={id} />;
          case "TextBlock":
            return <TextBlock key={id} text={String(block.props.text ?? "")} />;
          case "FieldBlock":
            if (visibleFieldIds && !visibleFieldIds.has(id)) {
              return null;
            }
            return (
              <FieldBlock
                key={id}
                {...(block.props as unknown as FieldBlockProps)}
              />
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
