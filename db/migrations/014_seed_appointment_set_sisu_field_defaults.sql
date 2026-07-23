-- Default SISU target fields for Appointment Set identity/contact/address mappings.
-- Only fills rows that still have a NULL sisu_field_name so operator overrides are kept.
UPDATE "form_sisu_mappings"
SET
  "sisu_field_name" = mapped.sisu_field_name,
  "updated_at" = NOW()
FROM (
  VALUES
    ('appointmentSet', 'clientFirstName', 'first_name'),
    ('appointmentSet', 'clientLastName', 'last_name'),
    ('appointmentSet', 'clientPhone', 'mobile_phone'),
    ('appointmentSet', 'clientEmail', 'email'),
    ('appointmentSet', 'leadType', 'client_type'),
    ('appointmentSet', 'notes', 'note'),
    ('appointmentSet', 'streetAddress', 'address_1'),
    ('appointmentSet', 'addressLine2', 'address_2'),
    ('appointmentSet', 'city', 'city'),
    ('appointmentSet', 'state', 'state'),
    ('appointmentSet', 'postalCode', 'postal_code')
) AS mapped(form, field_name, sisu_field_name)
WHERE
  "form_sisu_mappings"."form" = mapped.form
  AND "form_sisu_mappings"."field_name" = mapped.field_name
  AND (
    "form_sisu_mappings"."sisu_field_name" IS NULL
    OR btrim("form_sisu_mappings"."sisu_field_name") = ''
  );
