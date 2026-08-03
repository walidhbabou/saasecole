import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  isSchoolAdmin,
  isSchoolStaff,
  canAccessRole,
  dashboardPathForRole,
} = require("../src/lib/permissions.js");

test("admin permissions are scoped to school context", () => {
  assert.equal(isSchoolAdmin({ school_id: "school-1", role: "admin" }), true);
  assert.equal(isSchoolAdmin({ school_id: null, role: "admin" }), false);
  assert.equal(isSchoolStaff({ school_id: "school-1", role: "teacher" }), true);
  assert.equal(isSchoolStaff({ school_id: "school-1", role: "parent" }), false);
});

test("role access matches the dashboard routes", () => {
  assert.equal(canAccessRole("admin", ["admin", "teacher"]), true);
  assert.equal(canAccessRole("parent", ["admin", "teacher"]), false);
  assert.equal(dashboardPathForRole("super"), "/super/dashboard");
  assert.equal(dashboardPathForRole("teacher"), "/teacher/dashboard");
});

test("unknown roles fall back safely", () => {
  assert.equal(dashboardPathForRole("unexpected"), "/login");
});