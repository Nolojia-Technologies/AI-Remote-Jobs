-- 030: app_settings — remote-config the app reads at launch.
-- First use: the version gate. Bump latest_version_code on each store
-- release to prompt users; set min_supported_version_code to hard-block
-- builds that are too old/broken (non-dismissable update screen).
CREATE TABLE IF NOT EXISTS app_settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS app_settings_read ON app_settings;
CREATE POLICY app_settings_read ON app_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS app_settings_admin ON app_settings;
CREATE POLICY app_settings_admin ON app_settings FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO app_settings (key, value) VALUES ('version_gate', jsonb_build_object(
  'latest_version_code', 20,
  'min_supported_version_code', 0,
  'message', 'A new version of AI Remote Jobs is available with improvements and fixes.',
  'store_url', 'https://play.google.com/store/apps/details?id=com.aihustleacademy.app'
)) ON CONFLICT (key) DO NOTHING;
