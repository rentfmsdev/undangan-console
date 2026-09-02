UPDATE `templates`
SET `version` = 2,
    `manifest` = JSON_SET(`manifest`, '$.version', 2)
WHERE `id` = 'wedding-lampung-elegance';
