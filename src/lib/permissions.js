const ROLE_DASHBOARD = {
  super: "/super/dashboard",
  admin: "/admin/dashboard",
  teacher: "/teacher/dashboard",
  parent: "/parent/dashboard",
};

function hasRole(profile, role) {
  return Boolean(profile?.school_id) && profile?.role === role;
}

function isSchoolAdmin(profile) {
  return hasRole(profile, "admin");
}

function isSchoolStaff(profile) {
  return hasRole(profile, "admin") || hasRole(profile, "teacher");
}

function canAccessRole(currentRole, allowedRoles) {
  return allowedRoles.includes(currentRole);
}

function dashboardPathForRole(role) {
  return ROLE_DASHBOARD[role] ?? "/login";
}

module.exports = {
  ROLE_DASHBOARD,
  hasRole,
  isSchoolAdmin,
  isSchoolStaff,
  canAccessRole,
  dashboardPathForRole,
};