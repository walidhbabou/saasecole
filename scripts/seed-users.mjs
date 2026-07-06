// scripts/seed-users.mjs
// Crée les comptes démo dans Supabase Auth + profiles + schools
// Usage: node scripts/seed-users.mjs

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const lines = readFileSync(resolve(__dirname, "../.env"), "utf-8").split("\n");
  const env = {};
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const idx = t.indexOf("=");
    if (idx === -1) continue;
    env[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
  }
  return env;
}

const env = loadEnv();
const PROJECT_REF  = "qassqvsopzpwlbntbgks";
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ACCESS_TOKEN = env.SUPABASE_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.error("❌  SUPABASE_ACCESS_TOKEN manquant dans .env");
  process.exit(1);
}

// ── 1. Récupérer la service_role key via l'API Management ─
async function getServiceRoleKey() {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/api-keys`,
    { headers: { Authorization: `Bearer ${ACCESS_TOKEN}` } }
  );
  if (!res.ok) throw new Error(`Impossible de récupérer les API keys: ${res.status}`);
  const keys = await res.json();
  const srKey = keys.find((k) => k.name === "service_role");
  if (!srKey) throw new Error("service_role key non trouvée");
  return srKey.api_key;
}

// ── 2. Créer un utilisateur dans Supabase Auth ─────────────
async function createAuthUser(serviceKey, email, password, meta) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: meta,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    if (data.msg?.includes("already been registered") || data.code === "email_exists") {
      return null; // déjà existant
    }
    throw new Error(JSON.stringify(data));
  }
  return data;
}

// ── 3. Exécuter du SQL via l'API Management ────────────────
async function runSQL(sql) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

// ── Données à créer ────────────────────────────────────────
const SCHOOLS = [
  { name: "Lycée Ibn Khaldoun",  name_ar: "ثانوية ابن خلدون",    slug: "lycee-ibn-khaldoun",  city: "Casablanca", plan: "pro" },
  { name: "École Al Amal",        name_ar: "مدرسة الأمل",          slug: "ecole-al-amal",        city: "Casablanca", plan: "pro" },
  { name: "Institut Averroès",    name_ar: "معهد ابن رشد",         slug: "institut-averroes",    city: "Rabat",      plan: "basic" },
  { name: "École Riad Al Fath",   name_ar: "مدرسة رياض الفتح",    slug: "ecole-riad-al-fath",   city: "Marrakech",  plan: "pro" },
  { name: "École Al Nour",        name_ar: "مدرسة النور",          slug: "ecole-al-nour",        city: "Fès",        plan: "basic" },
  { name: "Collège Bab Doukkala", name_ar: "إعدادية باب الدكالة", slug: "college-bab-doukkala", city: "Meknès",     plan: "pro" },
];

const DEMO_USERS = [
  {
    email: "super@madrasati.ma",
    password: "demo123",
    meta: { first_name: "Mehdi", last_name: "Alaoui", role: "super" },
    schoolSlug: null,
  },
  {
    email: "admin@alamal.ma",
    password: "demo123",
    meta: { first_name: "Rachid", last_name: "Benali", role: "admin" },
    schoolSlug: "ecole-al-amal",
  },
  {
    email: "teacher@alamal.ma",
    password: "demo123",
    meta: { first_name: "Zineb", last_name: "Chraibi", role: "teacher" },
    schoolSlug: "ecole-al-amal",
  },
  {
    email: "parent@alamal.ma",
    password: "demo123",
    meta: { first_name: "Omar", last_name: "Kettani", role: "parent" },
    schoolSlug: "ecole-al-amal",
  },
];

// ── Main ───────────────────────────────────────────────────
async function main() {
  console.log("🚀  Madrasati — Seed utilisateurs & écoles\n");

  // 1. Récupérer la service role key
  process.stdout.write("🔑  Récupération de la service_role key... ");
  const serviceKey = await getServiceRoleKey();
  console.log("✓");

  // 2. Insérer les écoles
  console.log("\n🏫  Création des écoles...");
  for (const school of SCHOOLS) {
    process.stdout.write(`   ${school.name}... `);
    try {
      await runSQL(`
        INSERT INTO schools (name, name_ar, slug, city, country, plan, subscription_status)
        VALUES (
          '${school.name.replace(/'/g, "''")}',
          '${school.name_ar.replace(/'/g, "''")}',
          '${school.slug}',
          '${school.city}',
          'MA',
          '${school.plan}',
          'active'
        )
        ON CONFLICT (slug) DO NOTHING;
      `);
      console.log("✓");
    } catch (e) {
      console.log("⚠ existe déjà");
    }
  }

  // 3. Créer les utilisateurs Auth + profiles
  console.log("\n👤  Création des comptes utilisateurs...");
  for (const user of DEMO_USERS) {
    process.stdout.write(`   ${user.email} (${user.meta.role})... `);
    try {
      const authUser = await createAuthUser(serviceKey, user.email, user.password, user.meta);

      if (!authUser) {
        console.log("⚠ compte existe déjà");
        continue;
      }

      const userId = authUser.id;

      // Récupérer l'ID de l'école si nécessaire
      let schoolIdSQL = "NULL";
      if (user.schoolSlug) {
        schoolIdSQL = `(SELECT id FROM schools WHERE slug = '${user.schoolSlug}' LIMIT 1)`;
      }

      // Mettre à jour le profil (le trigger l'a déjà créé, on met à jour school_id)
      await runSQL(`
        UPDATE profiles SET
          school_id  = ${schoolIdSQL},
          first_name = '${user.meta.first_name}',
          last_name  = '${user.meta.last_name}',
          role       = '${user.meta.role}'
        WHERE id = '${userId}';
      `);

      console.log("✓");
    } catch (e) {
      console.log(`✗ ${e.message.slice(0, 80)}`);
    }
  }

  // 4. Résumé
  console.log("\n" + "─".repeat(55));
  console.log("✅  Seed terminé !\n");
  console.log("📋  Comptes de connexion :");
  console.log("┌─────────────────────────────────────────────────────┐");
  for (const u of DEMO_USERS) {
    console.log(`│  ${u.meta.role.padEnd(8)} │ ${u.email.padEnd(36)} │ demo123 │`);
  }
  console.log("└─────────────────────────────────────────────────────┘");
  console.log(`\n🔗  Auth users : https://supabase.com/dashboard/project/${PROJECT_REF}/auth/users`);
  console.log(`🔗  Tables     : https://supabase.com/dashboard/project/${PROJECT_REF}/database/tables`);
}

main().catch((err) => {
  console.error("\n❌  Erreur :", err.message);
  process.exit(1);
});
