-- Closed gained a Client Type (Buyer/Seller) field, first on the form.
-- Seed its mapping rows the same way the other forms' fields are seeded.
-- Like pending/appointmentSet/appointmentMet, the Client Type mapping to
-- the SISU client_type field is locked (see formFieldCatalog.ts
-- isLockedClientTypeSisuMapping), so it's inserted already mapped/enabled.
INSERT INTO "form_sisu_mappings" ("form", "field_name", "sisu_field_name", "sisu_field_type", "custom", "enabled") VALUES
  ('closed', 'clientType', 'client_type', NULL, FALSE, TRUE)
ON CONFLICT ("form", "field_name") DO UPDATE SET
  "sisu_field_name" = EXCLUDED."sisu_field_name",
  "sisu_field_type" = EXCLUDED."sisu_field_type",
  "custom" = EXCLUDED."custom",
  "enabled" = EXCLUDED."enabled",
  "updated_at" = NOW();

INSERT INTO "form_fub_person_mappings" ("form", "field_name", "fub_field_name", "enabled") VALUES
  ('closed', 'clientType', NULL, TRUE)
ON CONFLICT ("form", "field_name") DO NOTHING;

INSERT INTO "form_fub_deal_mappings" ("form", "field_name", "fub_field_name", "enabled") VALUES
  ('closed', 'clientType', NULL, TRUE)
ON CONFLICT ("form", "field_name") DO NOTHING;
