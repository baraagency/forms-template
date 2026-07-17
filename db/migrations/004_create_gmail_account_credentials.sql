-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS gmail_account_credentials_id_seq;

-- Table Definition
CREATE TABLE "public"."gmail_account_credentials" (
    "id" int4 NOT NULL DEFAULT nextval('gmail_account_credentials_id_seq'::regclass),
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    "environment" text NOT NULL,
    "email" text NOT NULL,
    "refresh_token" text NOT NULL,
    "access_token" text,
    "expiry_date" timestamptz,
    "active" bool NOT NULL DEFAULT true,
    PRIMARY KEY ("id")
);


-- Indices
CREATE UNIQUE INDEX gmail_account_credentials_environment_key ON public.gmail_account_credentials USING btree (environment);
