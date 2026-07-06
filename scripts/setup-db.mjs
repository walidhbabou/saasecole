// scripts/setup-db.mjs
// Crée toutes les tables Supabase automatiquement
// Usage: node scripts/setup-db.mjs

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Lire .env manuellement ────────────────────────────────
function loadEnv() {
  const envPath = resolve(__dirname, "../.env");
  const lines = readFileSync(envPath, "utf-8").split("\n");
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    env[key] = val;
  }
  return env;
}

const env = loadEnv();

const PROJECT_REF = "qassqvsopzpwlbntbgks";
const ACCESS_TOKEN = env.SUPABASE_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.error("❌  SUPABASE_ACCESS_TOKEN manquant dans .env");
  console.error("   → supabase.com/dashboard/account/tokens → Generate new token");
  process.exit(1);
}

// ── SQL à exécuter ────────────────────────────────────────
const SQL = readFileSync(
  resolve(__dirname, "../supabase/migrations/20260630000000_initial_schema.sql"),
  "utf-8"
);

// ── Exécuter via l'API Management Supabase ─────────────────
async function runSQL(sql, label) {
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

  const data = await res.json().catch(() => ({ error: res.statusText }));

  if (!res.ok) {
    throw new Error(
      `API error ${res.status}: ${JSON.stringify(data)}`
    );
  }
  return data;
}

// ── Découper le SQL en statements individuels ─────────────
function splitStatements(sql) {
  // Sépare par ";" en ignorant les ";" dans les $$ ... $$
  const statements = [];
  let current = "";
  let inDollar = false;

  const lines = sql.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("--")) {
      continue; // ignorer commentaires
    }
    if (line.includes("$$")) {
      inDollar = !inDollar;
    }
    current += line + "\n";
    if (!inDollar && trimmed.endsWith(";")) {
      const stmt = current.trim();
      if (stmt && stmt !== ";") statements.push(stmt);
      current = "";
    }
  }
  if (current.trim()) statements.push(current.trim());
  return statements.filter((s) => s.length > 1);
}

// ── Main ──────────────────────────────────────────────────
async function main() {
  console.log("🚀  Madrasati — Setup base de données");
  console.log(`📦  Projet : ${PROJECT_REF}\n`);

  const statements = splitStatements(SQL);
  console.log(`📋  ${statements.length} instructions SQL à exécuter\n`);

  let ok = 0;
  let errors = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    // Afficher les premières chars pour identifier
    const preview = stmt.replace(/\s+/g, " ").slice(0, 60);
    process.stdout.write(`  [${i + 1}/${statements.length}] ${preview}... `);

    try {
      await runSQL(stmt);
      console.log("✓");
      ok++;
    } catch (err) {
      const msg = err.message;
      // Ignorer les erreurs "already exists"
      if (
        msg.includes("already exists") ||
        msg.includes("duplicate") ||
        msg.includes("42710") || // duplicate_object
        msg.includes("42P07")    // duplicate_table
      ) {
        console.log("⚠ existe déjà (ignoré)");
        ok++;
      } else {
        console.log(`✗ ERREUR`);
        console.error(`     → ${msg.slice(0, 120)}`);
        errors++;
      }
    }
  }

  console.log(`\n${"─".repeat(50)}`);
  if (errors === 0) {
    console.log(`✅  Terminé ! ${ok} instructions exécutées avec succès.`);
    console.log(`\n   Vérifiez vos tables sur :`);
    console.log(`   https://supabase.com/dashboard/project/${PROJECT_REF}/database/tables`);
  } else {
    console.log(`⚠  ${ok} réussies, ${errors} erreurs.`);
    console.log(`   Vérifiez les erreurs ci-dessus.`);
  }
}

main().catch((err) => {
  console.error("\n❌  Erreur fatale :", err.message);
  process.exit(1);
});
