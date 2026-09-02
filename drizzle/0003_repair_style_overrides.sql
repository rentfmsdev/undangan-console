UPDATE `invitations`
SET `style_overrides` = JSON_OBJECT()
WHERE NOT JSON_VALID(`style_overrides`);
