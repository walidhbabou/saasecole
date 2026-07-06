// scripts/seed-data.mjs
// Ajoute les données de démonstration + policies RLS manquantes
// Usage: node scripts/seed-data.mjs

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
const ACCESS_TOKEN = env.SUPABASE_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.error("❌  SUPABASE_ACCESS_TOKEN manquant dans .env");
  process.exit(1);
}

async function runSQL(sql, label = "") {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: sql }),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

async function run(label, sql) {
  process.stdout.write(`   ${label}... `);
  try {
    await runSQL(sql);
    console.log("✓");
  } catch (e) {
    const msg = e.message;
    if (msg.includes("already exists") || msg.includes("duplicate") || msg.includes("42710") || msg.includes("42P07") || msg.includes("23505")) {
      console.log("⚠ déjà présent");
    } else {
      console.log(`✗ ${msg.slice(0, 120)}`);
    }
  }
}

async function main() {
  console.log("🚀  Madrasati — Seed données de démonstration\n");

  // ─────────────────────────────────────────────────────────
  // 1. POLICIES RLS MANQUANTES
  // ─────────────────────────────────────────────────────────
  console.log("🔒  Ajout des policies RLS...");

  await run("Schools — lecture membres", `
    CREATE POLICY "School members see own school" ON schools
    FOR SELECT USING (id = get_user_school_id());
  `);
  await run("Schools — super admin lecture", `
    CREATE POLICY "Super reads all schools" ON schools
    FOR SELECT USING (get_user_role() = 'super');
  `);
  await run("Schools — super admin gestion", `
    CREATE POLICY "Super manages all schools" ON schools
    FOR ALL USING (get_user_role() = 'super');
  `);
  await run("Profiles — super admin lecture", `
    CREATE POLICY "Super reads all profiles" ON profiles
    FOR SELECT USING (get_user_role() = 'super');
  `);
  await run("Students — super admin lecture", `
    CREATE POLICY "Super reads all students" ON students
    FOR SELECT USING (get_user_role() = 'super');
  `);
  await run("Classes — super admin lecture", `
    CREATE POLICY "Super reads all classes" ON classes
    FOR SELECT USING (get_user_role() = 'super');
  `);
  await run("Enrollments — super admin lecture", `
    CREATE POLICY "Super reads all enrollments" ON enrollments
    FOR SELECT USING (get_user_role() = 'super');
  `);
  await run("Fees — super admin lecture", `
    CREATE POLICY "Super reads all fees" ON fees
    FOR SELECT USING (get_user_role() = 'super');
  `);

  // Attendance sessions RLS
  await run("Attendance sessions — admin/teacher lecture", `
    CREATE POLICY "Admin and teacher see school sessions" ON attendance_sessions
    FOR SELECT USING (
      class_id IN (
        SELECT id FROM classes WHERE school_id = get_user_school_id()
      )
    );
  `);
  await run("Attendance sessions — admin gestion", `
    CREATE POLICY "Admin manages attendance sessions" ON attendance_sessions
    FOR ALL USING (
      class_id IN (
        SELECT id FROM classes WHERE school_id = get_user_school_id()
      ) AND get_user_role() IN ('admin', 'teacher')
    );
  `);

  // Attendance records RLS
  await run("Attendance records — admin/teacher lecture", `
    CREATE POLICY "Admin and teacher see records" ON attendance_records
    FOR SELECT USING (
      session_id IN (
        SELECT s.id FROM attendance_sessions s
        JOIN classes c ON c.id = s.class_id
        WHERE c.school_id = get_user_school_id()
      )
    );
  `);
  await run("Attendance records — admin/teacher gestion", `
    CREATE POLICY "Admin and teacher manage records" ON attendance_records
    FOR ALL USING (
      session_id IN (
        SELECT s.id FROM attendance_sessions s
        JOIN classes c ON c.id = s.class_id
        WHERE c.school_id = get_user_school_id()
          AND get_user_role() IN ('admin', 'teacher')
      )
    );
  `);
  await run("Attendance records — parent lecture", `
    CREATE POLICY "Parent sees child attendance records" ON attendance_records
    FOR SELECT USING (
      student_id IN (
        SELECT student_id FROM student_parents WHERE parent_id = auth.uid()
      )
    );
  `);

  // Fee types RLS
  await run("Fee types — admin gestion", `
    CREATE POLICY "Admin manages fee types" ON fee_types
    FOR ALL USING (school_id = get_user_school_id() AND get_user_role() = 'admin');
  `);

  // ─────────────────────────────────────────────────────────
  // 2. CLASSES
  // ─────────────────────────────────────────────────────────
  console.log("\n🏫  Création des classes...");
  const CLASSES = [
    { name: "CM2-A", max: 30 },
    { name: "CM2-B", max: 30 },
    { name: "CM1-A", max: 30 },
    { name: "CE2-A", max: 28 },
    { name: "CE1-B", max: 28 },
    { name: "CP-A",  max: 25 },
  ];
  for (const cls of CLASSES) {
    await run(`Classe ${cls.name}`, `
      INSERT INTO classes (school_id, name, academic_year, max_students, teacher_id)
      SELECT
        s.id,
        '${cls.name}',
        '2025-2026',
        ${cls.max},
        p.id
      FROM schools s
      JOIN profiles p ON p.first_name = 'Zineb' AND p.last_name = 'Chraibi'
      WHERE s.slug = 'ecole-al-amal'
      ON CONFLICT DO NOTHING;
    `);
  }

  // ─────────────────────────────────────────────────────────
  // 3. ÉLÈVES
  // ─────────────────────────────────────────────────────────
  console.log("\n👦  Création des élèves...");
  const STUDENTS = [
    { mat: "2025-001", fn: "Yassine",      ln: "Alami",      fn_ar: "ياسين",         ln_ar: "العلمي",   g: "M", bd: "2015-03-12", cls: "CM2-A" },
    { mat: "2025-002", fn: "Fatima Zahra", ln: "Bennis",     fn_ar: "فاطمة الزهراء", ln_ar: "بنيس",    g: "F", bd: "2016-07-22", cls: "CE1-B" },
    { mat: "2025-003", fn: "Omar",         ln: "Kettani",    fn_ar: "عمر",           ln_ar: "القطاني",  g: "M", bd: "2017-11-05", cls: "CP-A"  },
    { mat: "2025-004", fn: "Nadia",        ln: "Fassi",      fn_ar: "نادية",         ln_ar: "الفاسي",   g: "F", bd: "2015-09-18", cls: "CM2-A" },
    { mat: "2025-005", fn: "Hamza",        ln: "Tahiri",     fn_ar: "حمزة",          ln_ar: "الطاهري",  g: "M", bd: "2016-02-28", cls: "CE2-A" },
    { mat: "2025-006", fn: "Salma",        ln: "Idrissi",    fn_ar: "سلمى",          ln_ar: "الإدريسي", g: "F", bd: "2017-05-14", cls: "CP-A"  },
    { mat: "2025-007", fn: "Mehdi",        ln: "Cherkaoui",  fn_ar: "مهدي",          ln_ar: "الشرقاوي", g: "M", bd: "2015-08-03", cls: "CM1-A" },
    { mat: "2025-008", fn: "Imane",        ln: "Tazi",       fn_ar: "إيمان",         ln_ar: "الطازي",   g: "F", bd: "2015-12-19", cls: "CM1-A" },
    { mat: "2025-009", fn: "Karim",        ln: "Alaoui",     fn_ar: "كريم",          ln_ar: "العلوي",   g: "M", bd: "2016-04-10", cls: "CE2-A" },
    { mat: "2025-010", fn: "Sara",         ln: "Bennani",    fn_ar: "سارة",          ln_ar: "البناني",  g: "F", bd: "2016-09-30", cls: "CE1-B" },
    { mat: "2025-011", fn: "Amine",        ln: "Belhaj",     fn_ar: "أمين",          ln_ar: "بلحاج",    g: "M", bd: "2015-06-15", cls: "CM2-B" },
    { mat: "2025-012", fn: "Rim",          ln: "Lahlou",     fn_ar: "ريم",           ln_ar: "لحلو",     g: "F", bd: "2015-11-20", cls: "CM2-B" },
  ];

  for (const s of STUDENTS) {
    await run(`${s.fn} ${s.ln}`, `
      INSERT INTO students (school_id, matricule, first_name, last_name, first_name_ar, last_name_ar, gender, birth_date)
      SELECT id, '${s.mat}', '${s.fn.replace(/'/g,"''")}', '${s.ln}', '${s.fn_ar}', '${s.ln_ar}', '${s.g}', '${s.bd}'
      FROM schools WHERE slug = 'ecole-al-amal'
      ON CONFLICT (school_id, matricule) DO NOTHING;
    `);
  }

  // ─────────────────────────────────────────────────────────
  // 4. ENROLLMENTS
  // ─────────────────────────────────────────────────────────
  console.log("\n📋  Inscriptions aux classes...");
  for (const s of STUDENTS) {
    await run(`${s.mat} → ${s.cls}`, `
      INSERT INTO enrollments (school_id, student_id, class_id, academic_year, status)
      SELECT
        sc.id,
        st.id,
        cl.id,
        '2025-2026',
        'active'
      FROM schools sc
      JOIN students st ON st.matricule = '${s.mat}' AND st.school_id = sc.id
      JOIN classes  cl ON cl.name = '${s.cls}' AND cl.school_id = sc.id
      WHERE sc.slug = 'ecole-al-amal'
      ON CONFLICT DO NOTHING;
    `);
  }

  // ─────────────────────────────────────────────────────────
  // 5. LIEN PARENT → ENFANT
  // ─────────────────────────────────────────────────────────
  console.log("\n👨‍👦  Lien parent → enfant...");
  await run("Omar Kettani → Yassine Alami", `
    INSERT INTO student_parents (student_id, parent_id, relation, is_primary)
    SELECT
      st.id,
      pr.id,
      'parent',
      true
    FROM students st
    JOIN schools  sc ON sc.slug = 'ecole-al-amal' AND st.school_id = sc.id
    JOIN profiles pr ON pr.first_name = 'Omar' AND pr.last_name = 'Kettani'
    WHERE st.matricule = '2025-001'
    ON CONFLICT DO NOTHING;
  `);
  await run("Omar Kettani → Omar Kettani fils", `
    INSERT INTO student_parents (student_id, parent_id, relation, is_primary)
    SELECT
      st.id,
      pr.id,
      'parent',
      true
    FROM students st
    JOIN schools  sc ON sc.slug = 'ecole-al-amal' AND st.school_id = sc.id
    JOIN profiles pr ON pr.first_name = 'Omar' AND pr.last_name = 'Kettani'
    WHERE st.matricule = '2025-003'
    ON CONFLICT DO NOTHING;
  `);

  // ─────────────────────────────────────────────────────────
  // 6. TYPES DE FRAIS
  // ─────────────────────────────────────────────────────────
  console.log("\n💰  Types de frais...");
  await run("Frais d'inscription", `
    INSERT INTO fee_types (school_id, name, name_ar, amount, frequency)
    SELECT id, 'Frais d''inscription', 'رسوم التسجيل', 800, 'one-time'
    FROM schools WHERE slug = 'ecole-al-amal'
    ON CONFLICT DO NOTHING;
  `);
  await run("Frais scolaires mensuels", `
    INSERT INTO fee_types (school_id, name, name_ar, amount, frequency)
    SELECT id, 'Frais scolaires', 'الرسوم الدراسية', 1500, 'monthly'
    FROM schools WHERE slug = 'ecole-al-amal'
    ON CONFLICT DO NOTHING;
  `);

  // ─────────────────────────────────────────────────────────
  // 7. FRAIS (par élève)
  // ─────────────────────────────────────────────────────────
  console.log("\n📑  Création des frais par élève...");
  // Generate fees for each student: inscription (paid) + monthly fees
  await run("Frais inscription — tous élèves", `
    INSERT INTO fees (school_id, student_id, fee_type_id, amount, due_date, paid_at, status, academic_year)
    SELECT
      sc.id,
      st.id,
      ft.id,
      800,
      '2025-09-30',
      '2025-09-15',
      'paid',
      '2025-2026'
    FROM schools sc
    JOIN students st ON st.school_id = sc.id
    JOIN fee_types ft ON ft.school_id = sc.id AND ft.frequency = 'one-time'
    WHERE sc.slug = 'ecole-al-amal'
    ON CONFLICT DO NOTHING;
  `);

  const MONTHS = [
    { due: "2025-10-31", paid: "2025-10-28", status: "paid", paid_at: "2025-10-28" },
    { due: "2025-11-30", paid: "2025-11-25", status: "paid", paid_at: "2025-11-25" },
    { due: "2025-12-31", paid: "2025-12-20", status: "paid", paid_at: "2025-12-20" },
    { due: "2026-01-31", paid: "2026-01-28", status: "paid", paid_at: "2026-01-28" },
    { due: "2026-02-28", paid: "2026-02-25", status: "paid", paid_at: "2026-02-25" },
    { due: "2026-03-31", paid: "2026-03-29", status: "paid", paid_at: "2026-03-29" },
    { due: "2026-04-30", paid: "2026-04-28", status: "paid", paid_at: "2026-04-28" },
    { due: "2026-05-31", paid: "2026-05-30", status: "paid", paid_at: "2026-05-30" },
    { due: "2026-06-30", paid: null,         status: "paid", paid_at: "2026-06-10" },
    { due: "2026-07-31", paid: null,         status: "pending", paid_at: null },
  ];

  for (const m of MONTHS) {
    const paidAtSQL = m.paid_at ? `'${m.paid_at}'` : "NULL";
    await run(`Frais ${m.due}`, `
      INSERT INTO fees (school_id, student_id, fee_type_id, amount, due_date, paid_at, status, academic_year)
      SELECT
        sc.id,
        st.id,
        ft.id,
        1500,
        '${m.due}',
        ${paidAtSQL},
        '${m.status}',
        '2025-2026'
      FROM schools sc
      JOIN students st ON st.school_id = sc.id
      JOIN fee_types ft ON ft.school_id = sc.id AND ft.frequency = 'monthly'
      WHERE sc.slug = 'ecole-al-amal'
      ON CONFLICT DO NOTHING;
    `);
  }

  // Mark 2 students as overdue (for demo)
  await run("Frais en retard (demo)", `
    UPDATE fees SET status = 'overdue'
    WHERE student_id IN (
      SELECT st.id FROM students st
      JOIN schools sc ON sc.id = st.school_id AND sc.slug = 'ecole-al-amal'
      WHERE st.matricule IN ('2025-005', '2025-007')
    )
    AND due_date = '2026-06-30'
    AND status = 'paid';
  `);

  // ─────────────────────────────────────────────────────────
  // 8. SESSIONS DE PRÉSENCE
  // ─────────────────────────────────────────────────────────
  console.log("\n📅  Création des sessions de présence...");
  const DATES = ["2026-06-28", "2026-06-29", "2026-06-30"];
  const PERIODS = ["morning", "afternoon"];
  const SESSION_CLASSES = ["CM2-A", "CM2-B", "CM1-A", "CE2-A", "CE1-B", "CP-A"];

  for (const date of DATES) {
    for (const period of PERIODS) {
      for (const cls of SESSION_CLASSES) {
        await run(`Session ${date} ${period} ${cls}`, `
          INSERT INTO attendance_sessions (class_id, teacher_id, date, period)
          SELECT
            cl.id,
            cl.teacher_id,
            '${date}',
            '${period}'
          FROM classes cl
          JOIN schools sc ON sc.id = cl.school_id AND sc.slug = 'ecole-al-amal'
          WHERE cl.name = '${cls}' AND cl.academic_year = '2025-2026'
          ON CONFLICT (class_id, date, period) DO NOTHING;
        `);
      }
    }
  }

  // ─────────────────────────────────────────────────────────
  // 9. RECORDS DE PRÉSENCE
  // ─────────────────────────────────────────────────────────
  console.log("\n✅  Création des records de présence...");
  // All students present by default, with a few absences/late
  for (const date of DATES) {
    await run(`Records présence ${date} (matin)`, `
      INSERT INTO attendance_records (session_id, student_id, status)
      SELECT
        ses.id,
        en.student_id,
        CASE
          WHEN en.student_id = (SELECT id FROM students WHERE matricule = '2025-002' LIMIT 1)
            AND '${date}' = '2026-06-28' THEN 'absent'
          WHEN en.student_id = (SELECT id FROM students WHERE matricule = '2025-005' LIMIT 1)
            AND '${date}' = '2026-06-29' THEN 'late'
          WHEN en.student_id = (SELECT id FROM students WHERE matricule = '2025-007' LIMIT 1)
            AND '${date}' = '2026-06-30' THEN 'absent'
          ELSE 'present'
        END
      FROM attendance_sessions ses
      JOIN classes cl ON cl.id = ses.class_id
      JOIN schools sc ON sc.id = cl.school_id AND sc.slug = 'ecole-al-amal'
      JOIN enrollments en ON en.class_id = cl.id AND en.status = 'active'
      WHERE ses.date = '${date}' AND ses.period = 'morning'
      ON CONFLICT (session_id, student_id) DO NOTHING;
    `);
    await run(`Records présence ${date} (après-midi)`, `
      INSERT INTO attendance_records (session_id, student_id, status)
      SELECT ses.id, en.student_id, 'present'
      FROM attendance_sessions ses
      JOIN classes cl ON cl.id = ses.class_id
      JOIN schools sc ON sc.id = cl.school_id AND sc.slug = 'ecole-al-amal'
      JOIN enrollments en ON en.class_id = cl.id AND en.status = 'active'
      WHERE ses.date = '${date}' AND ses.period = 'afternoon'
      ON CONFLICT (session_id, student_id) DO NOTHING;
    `);
  }

  // ─────────────────────────────────────────────────────────
  console.log("\n" + "─".repeat(55));
  console.log("✅  Seed terminé !\n");
  console.log(`🔗  Tables : https://supabase.com/dashboard/project/${PROJECT_REF}/database/tables`);
}

main().catch((err) => {
  console.error("\n❌  Erreur :", err.message);
  process.exit(1);
});
