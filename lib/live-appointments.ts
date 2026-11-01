import type booking from "@/content/booking.json";
import type { Appointment } from "./demo";
import { accountRequest } from "./accounts";
export type BookingConfiguration = typeof booking;
export type BookingContext = { config: BookingConfiguration; viewer: string };
export type LiveAppointment = Appointment & {
  reference: string;
  revision: number;
  serviceName: string;
  companyName: string;
  priceLabel: string;
};
export type AppointmentPage = {
  items: LiveAppointment[];
  totalItems: number;
  totalPages: number;
  page: number;
};
export type AppointmentHistory = {
  action: string;
  at: string;
  actorName: string;
  change: Record<string, unknown>;
};
export type AppointmentDetail = {
  appointment: LiveAppointment;
  history: AppointmentHistory[];
};
export type AppointmentSummary = {
  viewer: string;
  upcomingCount: number;
  next: LiveAppointment | null;
};
export type Availability = {
  days: Record<string, string[]>;
  times: string[];
  today: string;
};
export type AppointmentDashboard = {
  start: string;
  end: string;
  waiting: number;
  workingDays: number;
  capacity: number;
  workMinutes: number;
  totals: {
    active: number;
    minutes: number;
    reservedMinutes: number;
    partners: number;
    customers: number;
    guests: number;
  };
  days: { date: string; total: number }[];
  closures: string[];
};

/** Serialize initial guest-cookie creation across tabs; capability tokens stay HttpOnly. */
export async function prepareBooking(signal?: AbortSignal) {
  const send = () =>
    accountRequest<BookingContext>(
      "/api/appointments/context",
      "POST",
      {},
      signal,
    );
  if (typeof navigator !== "undefined" && navigator.locks)
    return navigator.locks.request(
      "fairauto-booking-context",
      { signal },
      send,
    );
  return send();
}
