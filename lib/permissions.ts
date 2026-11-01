import type { Role } from "./demo";

/** Navigation capabilities. Account API permissions are checked independently on the server and in PocketBase. */
export const roleRules: Record<
  Role,
  {
    appointments: boolean;
    workshop: boolean;
    reports: boolean;
    administration: boolean;
  }
> = {
  partner: {
    appointments: false,
    workshop: false,
    reports: false,
    administration: false,
  },
  reception: {
    appointments: true,
    workshop: false,
    reports: false,
    administration: false,
  },
  manager: {
    appointments: true,
    workshop: true,
    reports: true,
    administration: false,
  },
  admin: {
    appointments: true,
    workshop: true,
    reports: true,
    administration: true,
  },
};
export const roleLabels: Record<Role, string> = {
  partner: "Céges partner",
  reception: "Munkafelvevő",
  manager: "Tulajdonos / vezető",
  admin: "Adminisztrátor",
};
export const roleHome: Record<Role, string> = {
  partner: "/partnerek",
  reception: "/munkafelvetel",
  manager: "/vezetes",
  admin: "/admin",
};
export const canCoordinateAppointments = (role?: Role) =>
  !!role && roleRules[role].appointments;
export const canManageWorkshop = (role?: Role) =>
  !!role && roleRules[role].workshop;
export const canViewReports = (role?: Role) =>
  !!role && roleRules[role].reports;
export const canAdminister = (role?: Role) =>
  !!role && roleRules[role].administration;
