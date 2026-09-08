-- The Client Type form field (clientType on pending, leadType on
-- appointmentSet/appointmentMet) must always map to the SISU "client_type"
-- field and stay enabled. Force it here (unlike migration 014's fill-only
-- backfill) since this mapping is locked and no longer operator-editable.
UPDATE "form_sisu_mappings"
SET
  "sisu_field_name" = 'client_type',
  "sisu_field_type" = NULL,
  "custom" = FALSE,
  "enabled" = TRUE,
  "updated_at" = NOW()
FROM (
  VALUES
    ('pending', 'clientType'),
    ('appointmentSet', 'leadType'),
    ('appointmentMet', 'leadType')
) AS locked(form, field_name)
WHERE
  "form_sisu_mappings"."form" = locked.form
  AND "form_sisu_mappings"."field_name" = locked.field_name;
