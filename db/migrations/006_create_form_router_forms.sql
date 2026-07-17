-- Table Definition
CREATE TABLE "public"."router_forms" (
    "slug" text NOT NULL,
    "name" text NOT NULL,
    "visible" bool NOT NULL DEFAULT true,
    PRIMARY KEY ("slug")
);
