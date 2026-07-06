-- Madrasati — Seed data (données de démonstration)
-- Exécuté automatiquement après db:reset

INSERT INTO schools (name, name_ar, slug, city, country, plan, subscription_status)
VALUES
  ('Lycée Ibn Khaldoun',   'ثانوية ابن خلدون',     'lycee-ibn-khaldoun',   'Casablanca', 'MA', 'pro',        'active'),
  ('École Al Amal',         'مدرسة الأمل',           'ecole-al-amal',         'Casablanca', 'MA', 'pro',        'active'),
  ('Institut Averroès',     'معهد ابن رشد',          'institut-averroes',     'Rabat',      'MA', 'basic',      'active'),
  ('École Riad Al Fath',    'مدرسة رياض الفتح',     'ecole-riad-al-fath',    'Marrakech',  'MA', 'pro',        'active'),
  ('École Al Nour',         'مدرسة النور',           'ecole-al-nour',         'Fès',        'MA', 'basic',      'trialing'),
  ('Collège Bab Doukkala',  'إعدادية باب الدكالة',  'college-bab-doukkala',  'Meknès',     'MA', 'pro',        'active')
ON CONFLICT (slug) DO NOTHING;
