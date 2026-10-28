import type { Config } from "@puckeditor/core";
import { FieldBlock } from "./blocks/FieldBlock";
import {
  DividerBlock,
  PageTitleBlock,
  SectionHeaderBlock,
  TextBlock,
} from "./blocks/StaticBlocks";
import { VisibilityRulesField } from "./blocks/VisibilityRulesField";
import { FieldMappingsPanel } from "./FieldMappingsPanel";
import type { FieldBlockProps } from "./formPageTypes";

type PageComponents = {
  PageTitle: { text: string };
  SectionHeader: { title: string };
  Divider: Record<string, never>;
  TextBlock: { text: string };
  FieldBlock: Omit<FieldBlockProps, "id">;
};

const yesNoOptions = [
  { label: "Yes", value: true },
  { label: "No", value: false },
];

export const formPageConfig: Config<PageComponents> = {
  // The page document has no editable root props; keep the panel focused on
  // the selected block instead of showing Puck's default "title" field.
  root: {
    fields: {},
  },
  components: {
    PageTitle: {
      label: "Page title",
      fields: {
        text: { type: "text", label: "Title" },
      },
      defaultProps: { text: "Page title" },
      render: ({ text }) => <PageTitleBlock text={text} />,
    },
    SectionHeader: {
      label: "Section header",
      fields: {
        title: { type: "text", label: "Title" },
      },
      defaultProps: { title: "Section" },
      render: ({ title }) => <SectionHeaderBlock title={title} />,
    },
    Divider: {
      label: "Divider",
      fields: {},
      render: () => <DividerBlock />,
    },
    TextBlock: {
      label: "Plain text",
      fields: {
        text: { type: "textarea", label: "Text" },
      },
      defaultProps: { text: "" },
      render: ({ text }) => <TextBlock text={text} />,
    },
    FieldBlock: {
      label: "Field",
      defaultProps: {
        label: "New field",
        kind: "text",
        required: false,
        optionSource: "manual",
      },
      fields: {
        label: { type: "text", label: "Label" },
        kind: {
          type: "select",
          label: "Type",
          options: [
            { label: "Text", value: "text" },
            { label: "Phone", value: "phone" },
            { label: "Email", value: "email" },
            { label: "Number", value: "number" },
            { label: "Currency ($)", value: "currency" },
            { label: "Percentage (%)", value: "percentage" },
            { label: "True/False", value: "boolean" },
            { label: "Choice", value: "choice" },
            { label: "Checkboxes", value: "multiChoice" },
            { label: "Date", value: "date" },
            { label: "Time", value: "time" },
          ],
        },
        display: {
          type: "select",
          label: "Choice display",
          options: [
            { label: "Dropdown", value: "select" },
            { label: "Radio", value: "radio" },
          ],
        },
        required: {
          type: "radio",
          label: "Required",
          options: yesNoOptions,
        },
        multiline: {
          type: "radio",
          label: "Multiline text",
          options: yesNoOptions,
        },
        tooltip: { type: "text", label: "Tooltip" },
        placeholder: { type: "text", label: "Placeholder" },
        optionSource: {
          type: "select",
          label: "Options source",
          options: [
            { label: "Manual", value: "manual" },
            { label: "SISU team field", value: "sisu" },
            { label: "SISU team agents", value: "sisuAgents" },
            { label: "SISU vendors", value: "sisuVendors" },
            { label: "FUB users", value: "fubUsers" },
            { label: "FUB appointment types", value: "fubAppointmentTypes" },
            { label: "US states", value: "usStates" },
          ],
        },
        optionFilter: {
          type: "text",
          label: "Option filter (role or vendor group)",
        },
        disableWhenEmpty: {
          type: "radio",
          label: "Disable when options are unavailable",
          options: yesNoOptions,
        },
        options: {
          type: "array",
          label: "Options",
          arrayFields: {
            label: { type: "text", label: "Label" },
            value: { type: "text", label: "Value" },
          },
          defaultItemProps: { label: "", value: "" },
          getItemSummary: (item) => item.label || item.value || "Option",
        },
        sisuFieldKey: { type: "text", label: "SISU field key" },
        dateConstraint: {
          type: "select",
          label: "Date constraint",
          options: [
            { label: "Any", value: "any" },
            { label: "Past or today", value: "past" },
            { label: "Today or future", value: "future" },
          ],
        },
        visibleWhen: {
          type: "custom",
          label: "Visible when",
          render: ({ value, onChange, readOnly }) => (
            <VisibilityRulesField
              value={value}
              onChange={onChange}
              readOnly={readOnly}
            />
          ),
        },
        mappings: {
          type: "custom",
          label: "Mappings",
          render: () => <FieldMappingsPanel />,
        },
      },
      render: ({ id, puck, editMode: _editMode, ...props }) => (
        // The canvas field is a visual preview only. Inert keeps its disabled
        // controls out of the tab order and the accessibility tree, where Puck
        // already wraps the block in a selectable button.
        <div inert={puck?.isEditing ? true : undefined}>
          <FieldBlock id={id} {...props} puck={puck} />
        </div>
      ),
    },
  },
};
