-- Check if emorain and oltmanjt share any organizations
SELECT
  u1.email as emorain_email,
  u2.email as oltmanjt_email,
  o.name as shared_organization,
  o.id as organization_id
FROM organization_members om1
JOIN organization_members om2 ON om1.organization_id = om2.organization_id
JOIN organizations o ON om1.organization_id = o.id
JOIN auth.users u1 ON om1.user_id = u1.id
JOIN auth.users u2 ON om2.user_id = u2.id
WHERE u1.email LIKE '%emorain%'
  AND u2.email LIKE '%oltmanjt%'
  AND om1.is_active = true
  AND om2.is_active = true;
