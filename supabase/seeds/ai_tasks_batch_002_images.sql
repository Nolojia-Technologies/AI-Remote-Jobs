-- AI Tasks — batch 002: real-photo annotation (verified Wikimedia CDN images).
-- Replaces the archived emoji image tasks. All answers hand-verified.
DO $$
DECLARE
  t jsonb;
  new_id uuid;
  i int := 0;
BEGIN
FOR t IN SELECT * FROM jsonb_array_elements($json$[
{"cat":"image_labeling","q":"Which animal is shown in the photo?","img":"https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/500px-Cat03.jpg","opts":["Cat","Fox","Rabbit","Dog"],"a":0},
{"cat":"image_labeling","q":"Which animal is shown in the photo?","img":"https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Golde33443.jpg/500px-Golde33443.jpg","opts":["Dog","Wolf","Fox","Goat"],"a":0},
{"cat":"image_labeling","q":"Which animal is shown in the photo?","img":"https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/African_Bush_Elephant.jpg/500px-African_Bush_Elephant.jpg","opts":["Elephant","Rhino","Hippo","Buffalo"],"a":0},
{"cat":"image_labeling","q":"Which animal is shown in the photo?","img":"https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Giraffe_Mikumi_National_Park.jpg/500px-Giraffe_Mikumi_National_Park.jpg","opts":["Giraffe","Camel","Antelope","Ostrich"],"a":0},
{"cat":"image_labeling","q":"Which animal is shown in the photo?","img":"https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Zebra_Botswana_edit02.jpg/500px-Zebra_Botswana_edit02.jpg","opts":["Zebra","Horse","Donkey","Okapi"],"a":0},
{"cat":"image_labeling","q":"Which bird is shown in the photo?","img":"https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Rooster_portrait2.jpg/500px-Rooster_portrait2.jpg","opts":["Rooster","Turkey","Peacock","Duck"],"a":0},
{"cat":"image_labeling","q":"Which animal is shown in the photo?","img":"https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Lion_waiting_in_Namibia.jpg/500px-Lion_waiting_in_Namibia.jpg","opts":["Lion","Leopard","Cheetah","Tiger"],"a":0},
{"cat":"image_labeling","q":"Which animal is shown in the photo?","img":"https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/2010-kodiak-bear-1.jpg/500px-2010-kodiak-bear-1.jpg","opts":["Bear","Gorilla","Wild boar","Bison"],"a":0},
{"cat":"image_labeling","q":"Which farm animal is shown in the photo?","img":"https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Cow_female_black_white.jpg/500px-Cow_female_black_white.jpg","opts":["Cow","Goat","Buffalo","Donkey"],"a":0},
{"cat":"image_labeling","q":"Which farm animal is shown in the photo?","img":"https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Sheep%2C_Stodmarsh_6.jpg/500px-Sheep%2C_Stodmarsh_6.jpg","opts":["Sheep","Goat","Alpaca","Calf"],"a":0},
{"cat":"image_labeling","q":"Which bird is shown in the photo?","img":"https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Mallard2.jpg/500px-Mallard2.jpg","opts":["Duck","Goose","Swan","Seagull"],"a":0},
{"cat":"object_detection","q":"Which vehicle is shown in the photo?","img":"https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Bicycle_1.jpg/500px-Bicycle_1.jpg","opts":["Bicycle","Motorbike","Scooter","Tricycle"],"a":0},
{"cat":"object_detection","q":"Which vehicle is shown in the photo?","img":"https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Airbus_A380_blue_sky.jpg/500px-Airbus_A380_blue_sky.jpg","opts":["Airplane","Helicopter","Drone","Glider"],"a":0},
{"cat":"image_labeling","q":"Which fruit is shown in the photo?","img":"https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Red_Apple.jpg/500px-Red_Apple.jpg","opts":["Apple","Tomato","Peach","Pomegranate"],"a":0},
{"cat":"image_labeling","q":"Which fruit is shown in the photo?","img":"https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Bananas_white_background_DS.jpg/500px-Bananas_white_background_DS.jpg","opts":["Bananas","Plantains","Mangoes","Corn"],"a":0},
{"cat":"image_labeling","q":"Which food is shown in the photo?","img":"https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Pizza_Margherita_stu_spivack.jpg/500px-Pizza_Margherita_stu_spivack.jpg","opts":["Pizza","Flatbread","Omelette","Pancake"],"a":0},
{"cat":"object_detection","q":"Which structure is shown in the photo?","img":"https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/GoldenGateBridge-001.jpg/500px-GoldenGateBridge-001.jpg","opts":["Bridge","Dam","Tower","Pier"],"a":0},
{"cat":"image_labeling","q":"Which flower is shown in the photo?","img":"https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Sunflower_sky_backdrop.jpg/500px-Sunflower_sky_backdrop.jpg","opts":["Sunflower","Daisy","Marigold","Dandelion"],"a":0},
{"cat":"image_labeling","q":"Which fruit is shown in the photo?","img":"https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Strawberries.jpg/500px-Strawberries.jpg","opts":["Strawberries","Cherries","Raspberries","Tomatoes"],"a":0},
{"cat":"object_detection","q":"What type of structure is shown in the photo?","img":"https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Taj_Mahal_%28Edited%29.jpeg/500px-Taj_Mahal_%28Edited%29.jpeg","opts":["Monument","Stadium","Shopping mall","Factory"],"a":0}
]$json$::jsonb)
LOOP
  i := i + 1;
  INSERT INTO ai_tasks (kind, category, title, description, difficulty, reward_cents, xp, est_seconds, content, repeatable, min_task_level, status, order_index)
  VALUES (
    'annotation', t->>'cat',
    CASE t->>'cat' WHEN 'object_detection' THEN 'Identify the object' ELSE 'Label the image' END,
    'Look at the photo carefully and pick the correct label. Your answer helps train AI vision models.',
    'easy', 3, 4, 30,
    jsonb_build_object('question', t->>'q', 'options', t->'opts', 'image_url', t->>'img'),
    false, 1, 'published', 300 + i
  ) RETURNING id INTO new_id;
  INSERT INTO ai_task_answers (task_id, answer) VALUES (new_id, jsonb_build_object('choice', (t->>'a')::int));
END LOOP;
END $$;
