-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS form_email_recipients_id_seq;

-- Table Definition
CREATE TABLE "public"."form_email_recipients" (
    "id" int4 NOT NULL DEFAULT nextval('form_email_recipients_id_seq'::regclass),
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "email" text NOT NULL,
    "form_type" text NOT NULL DEFAULT 'cashOffer'::text,
    "form_types" _text NOT NULL DEFAULT '{}'::text[],
    "active" bool NOT NULL DEFAULT true,
    "environment" text NOT NULL,
    PRIMARY KEY ("id")
);


-- Indices
CREATE UNIQUE INDEX form_email_recipients_environment_email_key ON public.form_email_recipients USING btree (lower(environment), lower(email));
CREATE INDEX form_email_recipients_environment_idx ON public.form_email_recipients USING btree (environment);
