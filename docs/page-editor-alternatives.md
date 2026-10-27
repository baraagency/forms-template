# Page editor alternatives to craft.js

Checked against npm and GitHub on **2026-10-27**.

## Why craft.js is a risk

- Last release and last commit: `@craftjs/core` 0.2.12, **2025-02-14**.
- 227 open issues; the maintainer has moved on (see issue #747, "Is Craft.js still maintained?").
- React 19 works in the common case, but [issue #744](https://github.com/prevwong/craft.js/issues/744) reports `element.ref` errors when `<Element canvas>` is created dynamically in a loop.

There is no maintained, headless, API-compatible successor. The realistic options are a different editor model, or a fork you own.

## Shortlist

| Option | Latest release | Repo activity | Model | Fit for this project | License |
| --- | --- | --- | --- | --- | --- |
| **Puck** (`@puckeditor/core`) | 0.23.0, 2026-08-07 | commits 2026-10-27, 13.5k stars, ~309k weekly downloads | React component tree, drag/drop, config + fields, JSON | Closest maintained replacement | MIT |
| **GrapesJS** | 0.23.8, 2026-10-15 | pushed 2026-10-21, 26.3k stars | Framework-agnostic HTML/CSS builder, iframe canvas | Good for freeform design, heavier for typed forms | BSD-3-Clause |
| **Builder.io** (`@builder.io/react`) | 9.4.10, 2026-10-20 | pushed 2026-10-26 | Hosted visual CMS + MIT SDK | Commercial, content lives outside Postgres | MIT SDK |
| **Plasmic** | loader 2.0.25, 2026-10-26 | pushed 2026-10-27 | Separate visual builder/codegen platform | Powerful, but heavyweight and external | MIT |
| **Craft.js fork** (`@deepctrls/craftjs`) | 0.2.18, 2026-10-21 | 3 stars, ~41 weekly downloads | Same craft.js API | Only if craft API is mandatory; too small to depend on | MIT |

## Puck (recommended)

- A React component, not a platform: `<Puck config data onPublish />` for editing and `<Render config data />` for the published page.
- You own the data. The payload is JSON (`{ content, root, zones }`) that can go straight into a Postgres `jsonb` column.
- Components and fields are declared in your own config, so the page title, section header, divider, text block and field types are all local React components.
- `custom` fields support your own inspector UI (options editor, SISU/FUB mapping selects, visibility rules).
- Ships a React Router framework-mode recipe, though it targets React Router 7; the editor itself does not depend on router internals, so verify v8 in a spike.
- MIT, self-hosted, no vendor backend, ~309k weekly downloads.
- Trade-off: it is an editor with its own UI and a pre-1.0 API (0.23), not a set of headless primitives like craft. Its `overrides` and composition APIs let you replace the header, drawer, fields and preview, but you are working within its model.

## GrapesJS

- Mature and active. Embeds in any page; `@grapesjs/react` provides a React wrapper.
- Data is a GrapesJS project (pages, styles, components), not a form-field schema. Fields would be custom components serialized as HTML/CSS, and typed field config still has to live somewhere else.
- The React wrapper last shipped 2.0.0 in **2025-02-20** (peer allows React 19, core peer says `grapesjs ^0.22.5` while core is 0.23.8). The core is maintained; the wrapper is behind.
- Choose it only if freeform styling/HTML is the point. For a fixed set of accessible form blocks it adds work compared with Puck.

## Builder.io, Plasmic, and CMS layers

- **Builder.io**: the MIT repo is the SDK; the visual editor is Builder's hosted product. Content is stored/served by Builder unless you build a sync. That conflicts with keeping page JSON in this app's Postgres.
- **Plasmic**: open-source repo, but the builder is a separate platform and the runtime pulls content through the Plasmic loader/CDN. Codegen and localization are strong; overkill for five block types.
- **TinaCMS**: Apache-2.0, active, but content is Git-backed (Markdown/MDX), not Postgres JSON.
- **Payload**: MIT, active, but its admin is Next-based; adopting it means a second app and stack for a feature that is one editor screen.
- **Webstudio**: active, AGPL-3.0, standalone website builder. Strong copyleft and not an embedded admin editor.
- **Onlook**: active, but it is an AI design tool that edits application code, not runtime page content.

## Domain-specific option: SurveyJS Creator

If the page-layout blocks (title, section header, divider, text) are negotiable and the real requirement is a form builder, `survey-creator-react` 3.2.3 (2026-10-27) is active, React 19-ready, JSON-driven, and has conditional logic and validation built in. The Creator is separately licensed (the runtime `survey-core` is MIT), so check licensing before use. It is a form builder, not a page editor.

## Verdict

Use **Puck** if the requirement is "a maintained visual editor with our own React components and JSON in our database."

Keep craft.js only if its headless API is a hard requirement and you are prepared to pin it, avoid dynamic canvas elements, and vendor fixes. Do not adopt the DeepCtrls fork for production on the strength of 3 stars.

For this repo, Puck maps cleanly onto the earlier plan: five block components, one custom `Field` inspector, `PageDocument` stored in `form_pages.draft/published`, `<Render>` on the public route, and the editor behind the admin cookie. The parts Puck does not solve stay ours: conditional visibility at submit time, server-side validation, mapping rows, and per-form business logic.

## Sources

- craft.js repo and releases: https://github.com/prevwong/craft.js
- craft.js React 19 issue: https://github.com/prevwong/craft.js/issues/744
- craft.js maintenance thread: https://github.com/prevwong/craft.js/issues/747
- Puck repo: https://github.com/puckeditor/puck
- Puck docs (config, data model, custom fields): https://puckeditor.com/docs
- Puck React Router recipe: https://github.com/puckeditor/puck/tree/main/recipes/react-router
- Puck npm: https://www.npmjs.com/package/@puckeditor/core
- GrapesJS repo: https://github.com/GrapesJS/grapesjs
- GrapesJS React wrapper: https://www.npmjs.com/package/@grapesjs/react
- Builder.io repo: https://github.com/builderio/builder
- Plasmic repo: https://github.com/plasmicapp/plasmic
- TinaCMS repo: https://github.com/tinacms/tinacms
- Payload repo: https://github.com/payloadcms/payload
- SurveyJS Creator: https://github.com/surveyjs/survey-creator
