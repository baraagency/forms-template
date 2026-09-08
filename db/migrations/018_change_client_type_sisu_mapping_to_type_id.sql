-- The locked Client Type mapping now targets SISU's type_id field instead
-- of client_type (Buyer -> "b", Seller -> "s"; see
-- normalizeSisuClientTypeFields.ts and formFieldCatalog.ts
-- CLIENT_TYPE_SISU_FIELD_NAME). Repoint any rows still mapped to the old
-- client_type field.
UPDATE "form_sisu_mappings"
SET
  "sisu_field_name" = 'type_id',
  "updated_at" = NOW()
FROM (
  VALUES
    ('pending', 'clientType'),
    ('appointmentSet', 'leadType'),
    ('appointmentMet', 'leadType'),
    ('closed', 'clientType')
) AS locked(form, field_name)
WHERE
  "form_sisu_mappings"."form" = locked.form
  AND "form_sisu_mappings"."field_name" = locked.field_name;
