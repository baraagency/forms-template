-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS form_email_recipients_id_seq;

-- Table Definition
-- One recipient row per form_type (same email may appear on multiple forms / multiple times).
CREATE TABLE "public"."form_email_recipients" (
    "id" int4 NOT NULL DEFAULT nextval('form_email_recipients_id_seq'::regclass),
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "email" text NOT NULL,
    "form_type" text NOT NULL,
    "active" bool NOT NULL DEFAULT true,
    "environment" text NOT NULL,
    PRIMARY KEY ("id")
);

-- Indices (emails are not unique — same address may be listed more than once)
CREATE INDEX form_email_recipients_environment_idx ON public.form_email_recipients USING btree (environment);
CREATE INDEX form_email_recipients_environment_form_type_idx ON public.form_email_recipients USING btree (environment, form_type);
