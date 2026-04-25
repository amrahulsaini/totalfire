-- TotalFire migration: promote app update policy to v1.0.3 defaults
-- Safe to run on MySQL 8.x

UPDATE app_update_settings
SET download_url = 'https://totalfire.in/downloads/totalfire-v1.0.3.apk'
WHERE id = 1
  AND download_url IN (
    'https://totalfire.in/downloads/totalfire-latest.apk',
    'https://totalfire.in/downloads/totalfire-v1.0.1.apk',
    'https://totalfire.in/downloads/totalfire-v1.0.2.apk'
  );

UPDATE app_update_settings
SET latest_version = '1.0.3',
    min_supported_version = '1.0.3'
WHERE id = 1
  AND latest_version IN ('1.0.1', '1.0.2')
  AND min_supported_version IN ('1.0.1', '1.0.2');
