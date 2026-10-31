import type { LegalAcknowledgement } from "./legal";
import { site, serviceOptions } from "@/content/site";
export type View =
  | "overview"
  | "booking"
  | "appointments"
  | "vehicles"
  | "account"
  | "partners"
  | "workshop"
  | "reception"
  | "admin"
  | "management";
export type Role = "customer" | "partner" | "reception" | "manager" | "admin";
export type Profile = {
  name: string;
  email: string;
  phone: string;
  city: string;
  reminders: boolean;
};
export type User = Profile & {
  id: string;
  role: Role;
  passwordHash?: string;
  salt?: string;
  legalAcknowledgement?: LegalAcknowledgement;
};
export type Vehicle = {
  id: string;
  owner: string;
  plate: string;
  make: string;
  model: string;
  year: string;
  isDefault: boolean;
};
export type Status =
  "requested" | "confirmed" | "progress" | "completed" | "cancelled";
export type Appointment = {
  id: string;
  owner: string | null;
  organization: boolean;
  service: string;
  date: string;
  time: string;
  duration: number;
  contact: Profile;
  vehicle: Omit<Vehicle, "id" | "owner" | "isDefault">;
  note: string;
  status: Status;
  created: string;
  demo?: boolean;
  legalAcknowledgement?: LegalAcknowledgement;
  confirmation?: {
    method: "phone";
    at: string;
    actorId: string;
    actorName: string;
  };
};
export type Store = {
  version: 1;
  rolesRevision?: 2;
  users: User[];
  vehicles: Vehicle[];
  appointments: Appointment[];
  blockedDates: string[];
  companies: Record<string, { name: string; tax: string; city: string }>;
};
export const managerDemoUser: User = {
  id: "demo-manager",
  role: "manager",
  name: "Fair vezető",
  email: "vezeto@example.com",
  phone: "+36 20 123 4567",
  city: "Székesfehérvár",
  reminders: true,
};
export const receptionDemoUser: User = {
  id: "demo-reception",
  role: "reception",
  name: "Fair munkafelvevő",
  email: "munkafelvetel@example.com",
  phone: "+36 20 123 4567",
  city: "Székesfehérvár",
  reminders: false,
};
export const adminDemoUser: User = {
  id: "demo-admin",
  role: "admin",
  name: "Fair admin",
  email: "admin@example.com",
  phone: "+36 20 123 4567",
  city: "Székesfehérvár",
  reminders: false,
};
export const STORE_KEY = "fairauto-prototype-v1";
export const SESSION_KEY = "fairauto-session-v1";
export const services = serviceOptions;
export const statusNames: Record<Status, string> = {
  requested: "Telefonos egyeztetésre vár",
  confirmed: "Visszaigazolva",
  progress: "Folyamatban",
  completed: "Elkészült",
  cancelled: "Lemondva",
};
export const times = Array.from(
  {
    length: Math.ceil(
      (minutes(site.booking.closesAt) - minutes(site.booking.opensAt)) /
        site.booking.slotMinutes,
    ),
  },
  (_, index) => endTime(site.booking.opensAt, index * site.booking.slotMinutes),
);
export function today() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: site.booking.timeZone,
  }).format(new Date());
}
export function addDays(day: string, count: number) {
  const d = new Date(`${day}T12:00:00`);
  d.setDate(d.getDate() + count);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function weekday(day: string) {
  return new Date(`${day}T12:00:00`).getDay();
}
export function nextBusinessDay(offset = 1) {
  let d = addDays(today(), offset);
  for (let checked = 0; checked < 7; checked++) {
    if (!site.booking.closedWeekdays.includes(weekday(d))) return d;
    d = addDays(d, 1);
  }
  throw new Error(
    "A foglalási beállításokban legalább egy nyitott nap szükséges.",
  );
}
export function dateLabel(
  day: string,
  options: Intl.DateTimeFormatOptions = {
    month: "long",
    day: "numeric",
    weekday: "long",
  },
) {
  return new Date(`${day}T12:00:00`).toLocaleDateString("hu-HU", options);
}
export function minutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}
export function endTime(time: string, duration: number) {
  const m = minutes(time) + duration;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}
export function available(
  store: Store,
  day: string,
  time: string,
  duration: number,
  exclude?: string,
) {
  if (
    day < today() ||
    site.booking.closedWeekdays.includes(weekday(day)) ||
    store.blockedDates.includes(day) ||
    day > addDays(today(), site.booking.horizonDays) ||
    minutes(time) < minutes(site.booking.opensAt) ||
    minutes(time) + duration > minutes(site.booking.closesAt)
  )
    return false;
  if (day === today()) {
    const now = new Intl.DateTimeFormat("en-GB", {
      timeZone: site.booking.timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date());
    if (time <= now) return false;
  }
  // Configured demo capacity. Replace with a server transaction when PocketBase booking is integrated.
  const overlapping = store.appointments.filter(
    (a) =>
      a.id !== exclude &&
      a.date === day &&
      a.status !== "cancelled" &&
      minutes(a.time) < minutes(time) + duration &&
      minutes(a.time) + a.duration > minutes(time),
  );
  const points = [
    minutes(time),
    ...overlapping
      .map((a) => minutes(a.time))
      .filter((m) => m >= minutes(time)),
  ];
  return points.every(
    (p) =>
      overlapping.filter(
        (a) => minutes(a.time) <= p && minutes(a.time) + a.duration > p,
      ).length < site.booking.capacity,
  );
}
export function id(prefix = "FA") {
  return `${prefix}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}
export function initialStore(): Store {
  const contact = {
    name: "Kovács Péter",
    email: "peter@example.com",
    phone: "+36 30 123 4567",
    city: "Székesfehérvár",
    reminders: true,
  };
  return {
    version: 1,
    rolesRevision: 2,
    users: [
      managerDemoUser,
      receptionDemoUser,
      adminDemoUser,
      { ...contact, id: "demo-customer", role: "customer" },
      {
        ...contact,
        id: "demo-partner",
        role: "partner",
        name: "Nagy Anna",
        email: "partner@example.com",
      },
    ],
    vehicles: [
      {
        id: "car-1",
        owner: "demo-customer",
        plate: "ABC-123",
        make: "Volkswagen",
        model: "Golf VII",
        year: "2018",
        isDefault: true,
      },
      {
        id: "fleet-1",
        owner: "demo-partner",
        plate: "FLT-101",
        make: "Škoda",
        model: "Octavia",
        year: "2021",
        isDefault: true,
      },
      {
        id: "fleet-2",
        owner: "demo-partner",
        plate: "FLT-102",
        make: "Ford",
        model: "Transit",
        year: "2020",
        isDefault: false,
      },
    ],
    appointments: [
      {
        id: "FA-MINTA01",
        owner: "demo-partner",
        organization: true,
        service: "maintenance",
        date: nextBusinessDay(),
        time: "09:00",
        duration: 90,
        contact: { ...contact, name: "Nagy Anna" },
        vehicle: {
          plate: "FLT-101",
          make: "Škoda",
          model: "Octavia",
          year: "2021",
        },
        note: "Céges mintaidőpont · éves karbantartás",
        status: "confirmed",
        created: new Date().toISOString(),
        demo: true,
      },
    ],
    blockedDates: [],
    companies: {
      "demo-partner": {
        name: "Fehérvár Logistics Kft.",
        tax: "12345678-2-07",
        city: "Székesfehérvár",
      },
    },
  };
}
export function readStore(): Store {
  const raw = localStorage.getItem(STORE_KEY);
  if (!raw) return initialStore();
  const data = JSON.parse(raw);
  if (
    data.version !== 1 ||
    !Array.isArray(data.users) ||
    !Array.isArray(data.vehicles) ||
    !Array.isArray(data.appointments) ||
    !Array.isArray(data.blockedDates) ||
    !data.companies
  )
    throw new Error("A mentett demóadatok nem olvashatók.");
  // Existing staff saves become reception profiles; appointment snapshots stay intact.
  const legacyUsers = data.users as (Omit<User, "role"> & {
    role: Role | "staff";
  })[];
  const legacyDemo = legacyUsers.find((user) => user.id === "demo-staff");
  const users: User[] = legacyUsers
    .filter((user) => user.id !== "demo-staff")
    .map((user) => ({
      ...user,
      role: user.role === "staff" ? "reception" : user.role,
    }));
  if (data.rolesRevision !== 2) {
    for (const sample of [managerDemoUser, receptionDemoUser, adminDemoUser])
      if (!users.some((user) => user.id === sample.id))
        users.push(
          sample.role === "reception"
            ? { ...sample, ...legacyDemo, id: sample.id, role: "reception" }
            : sample,
        );
  }
  return {
    ...data,
    rolesRevision: 2,
    users,
    vehicles: data.vehicles.map((vehicle: Vehicle) =>
      vehicle.owner === "demo-staff"
        ? { ...vehicle, owner: receptionDemoUser.id }
        : vehicle,
    ),
    appointments: data.appointments.map((appointment: Appointment) =>
      appointment.owner === "demo-staff"
        ? { ...appointment, owner: receptionDemoUser.id }
        : appointment,
    ),
  };
}
export function writeStore(store: Store) {
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
  window.dispatchEvent(new Event("fairauto-store"));
}
export async function passwordDigest(password: string, salt: string) {
  const bytes = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    bytes.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const result = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: bytes.encode(salt),
      iterations: 100000,
      hash: "SHA-256",
    },
    key,
    256,
  );
  return Array.from(new Uint8Array(result))
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}
