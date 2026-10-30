export type View =
  | "overview"
  | "booking"
  | "appointments"
  | "vehicles"
  | "account"
  | "partners"
  | "workshop"
  | "management";
export type Role = "customer" | "partner" | "staff" | "manager";
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
};
export type Store = {
  version: 1;
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
export const STORE_KEY = "fairauto-prototype-v1";
export const SESSION_KEY = "fairauto-session-v1";
export const services = [
  {
    id: "maintenance",
    name: "Karbantartás és javítás",
    short: "Karbantartás",
    description: "Olajcsere, időszakos szerviz, megelőző gondoskodás.",
    duration: 90,
    icon: "wrench",
    tag: "A mindennapok biztonsága",
  },
  {
    id: "inspection",
    name: "Műszaki vizsga",
    short: "Műszaki vizsga",
    description: "Felkészítés és helyszíni vizsgáztatás, egy helyen.",
    duration: 60,
    icon: "shield",
    tag: "Nyugodtan tovább",
  },
  {
    id: "diagnostics",
    name: "Diagnosztika",
    short: "Diagnosztika",
    description: "Pontos hibafeltárás korszerű diagnosztikai eszközökkel.",
    duration: 60,
    icon: "scan",
    tag: "Tisztán látni",
  },
  {
    id: "tyres",
    name: "Gumi- és futóműszerviz",
    short: "Gumi és futómű",
    description: "Szezonális gumicsere, centrírozás és futóműellenőrzés.",
    duration: 60,
    icon: "wheel",
    tag: "Biztos úttartás",
  },
  {
    id: "other",
    name: "Egyéb szervizigény",
    short: "Egyéb szerviz",
    description: "Mondd el, miben segíthetünk az autóddal kapcsolatban.",
    duration: 60,
    icon: "wrench",
    tag: "Beszéljük meg",
  },
];
export const statusNames: Record<Status, string> = {
  requested: "Visszaigazolásra vár",
  confirmed: "Visszaigazolva",
  progress: "Folyamatban",
  completed: "Elkészült",
  cancelled: "Lemondva",
};
export const times = [
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
];
export function today() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Budapest",
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
  while ([0, 6].includes(weekday(d))) d = addDays(d, 1);
  return d;
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
    [0, 6].includes(weekday(day)) ||
    store.blockedDates.includes(day) ||
    minutes(time) + duration > 17 * 60
  )
    return false;
  if (day === today()) {
    const now = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Budapest",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date());
    if (time <= now) return false;
  }
  // Prototype capacity: two concurrent appointments. Replaced by a server transaction with PocketBase.
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
      ).length < 2,
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
    users: [
      managerDemoUser,
      { ...contact, id: "demo-customer", role: "customer" },
      {
        ...contact,
        id: "demo-partner",
        role: "partner",
        name: "Nagy Anna",
        email: "partner@example.com",
      },
      {
        ...contact,
        id: "demo-staff",
        role: "staff",
        name: "Fair munkatárs",
        email: "muhely@example.com",
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
  // Add the new demo role without replacing any existing profiles or bookings.
  return data.users.some((user: User) => user.id === managerDemoUser.id)
    ? data
    : { ...data, users: [...data.users, managerDemoUser] };
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
