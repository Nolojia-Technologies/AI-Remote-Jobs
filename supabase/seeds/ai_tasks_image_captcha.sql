-- Image Captcha — reCAPTCHA-style photo grid ("Tap the cow").
-- The photo pool lives in content.images (task-images bucket); the app
-- builds a random 6-photo grid per round. Edit the pool from admin →
-- AI Tasks → Image Captcha (content JSON) to add subjects.
INSERT INTO ai_tasks (kind, category, title, description, difficulty, reward_cents, xp, est_seconds, content, repeatable, status, order_index)
SELECT 'captcha', 'captcha_image', 'Image Captcha',
  'Tap the picture that matches the prompt.', 'easy', 2, 1, 10,
  jsonb_build_object('generator', 'image', 'images', $json$[
    {"label":"cat","url":"https://xuurnnvppxthnnsvrcgd.supabase.co/storage/v1/object/public/task-images/500px-Cat03.jpg"},
    {"label":"dog","url":"https://xuurnnvppxthnnsvrcgd.supabase.co/storage/v1/object/public/task-images/500px-Golde33443.jpg"},
    {"label":"elephant","url":"https://xuurnnvppxthnnsvrcgd.supabase.co/storage/v1/object/public/task-images/500px-African_Bush_Elephant.jpg"},
    {"label":"giraffe","url":"https://xuurnnvppxthnnsvrcgd.supabase.co/storage/v1/object/public/task-images/500px-Giraffe_Mikumi_National_Park.jpg"},
    {"label":"zebra","url":"https://xuurnnvppxthnnsvrcgd.supabase.co/storage/v1/object/public/task-images/500px-Zebra_Botswana_edit02.jpg"},
    {"label":"rooster","url":"https://xuurnnvppxthnnsvrcgd.supabase.co/storage/v1/object/public/task-images/500px-Rooster_portrait2.jpg"},
    {"label":"lion","url":"https://xuurnnvppxthnnsvrcgd.supabase.co/storage/v1/object/public/task-images/500px-Lion_waiting_in_Namibia.jpg"},
    {"label":"bear","url":"https://xuurnnvppxthnnsvrcgd.supabase.co/storage/v1/object/public/task-images/500px-2010-kodiak-bear-1.jpg"},
    {"label":"cow","url":"https://xuurnnvppxthnnsvrcgd.supabase.co/storage/v1/object/public/task-images/500px-Cow_female_black_white.jpg"},
    {"label":"sheep","url":"https://xuurnnvppxthnnsvrcgd.supabase.co/storage/v1/object/public/task-images/500px-Sheep__Stodmarsh_6.jpg"},
    {"label":"duck","url":"https://xuurnnvppxthnnsvrcgd.supabase.co/storage/v1/object/public/task-images/500px-Mallard2.jpg"},
    {"label":"bicycle","url":"https://xuurnnvppxthnnsvrcgd.supabase.co/storage/v1/object/public/task-images/500px-Bicycle_1.jpg"},
    {"label":"airplane","url":"https://xuurnnvppxthnnsvrcgd.supabase.co/storage/v1/object/public/task-images/500px-Airbus_A380_blue_sky.jpg"},
    {"label":"apple","url":"https://xuurnnvppxthnnsvrcgd.supabase.co/storage/v1/object/public/task-images/500px-Red_Apple.jpg"},
    {"label":"bananas","url":"https://xuurnnvppxthnnsvrcgd.supabase.co/storage/v1/object/public/task-images/500px-Bananas_white_background_DS.jpg"},
    {"label":"pizza","url":"https://xuurnnvppxthnnsvrcgd.supabase.co/storage/v1/object/public/task-images/500px-Pizza_Margherita_stu_spivack.jpg"},
    {"label":"bridge","url":"https://xuurnnvppxthnnsvrcgd.supabase.co/storage/v1/object/public/task-images/500px-GoldenGateBridge-001.jpg"},
    {"label":"sunflower","url":"https://xuurnnvppxthnnsvrcgd.supabase.co/storage/v1/object/public/task-images/500px-Sunflower_sky_backdrop.jpg"},
    {"label":"strawberries","url":"https://xuurnnvppxthnnsvrcgd.supabase.co/storage/v1/object/public/task-images/500px-Strawberries.jpg"},
    {"label":"monument","url":"https://xuurnnvppxthnnsvrcgd.supabase.co/storage/v1/object/public/task-images/500px-Taj_Mahal__Edited_.jpeg"}
  ]$json$::jsonb),
  true, 'published', 0
WHERE NOT EXISTS (
  SELECT 1 FROM ai_tasks WHERE kind = 'captcha' AND category = 'captcha_image'
);
