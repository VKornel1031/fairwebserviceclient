import { test, expect } from "@playwright/test";
import {
  initialStore,
  available,
  nextBusinessDay,
  addDays,
  weekday,
} from "../lib/demo";
test("duration, closures, weekends and concurrent bookings affect availability", () => {
  const s = initialStore();
  s.appointments = [];
  const day = nextBusinessDay();
  expect(available(s, day, "16:00", 90)).toBe(false);
  expect(available(s, day, "16:00", 60)).toBe(true);
  s.blockedDates = [day];
  expect(available(s, day, "09:00", 60)).toBe(false);
  s.blockedDates = [];
  let weekend = day;
  while (weekday(weekend) !== 6) weekend = addDays(weekend, 1);
  expect(available(s, weekend, "09:00", 60)).toBe(false);
  const seed = initialStore().appointments[0];
  s.appointments = [
    { ...seed, id: "one", date: day, time: "09:00", duration: 90 },
  ];
  expect(available(s, day, "09:00", 60)).toBe(true);
  s.appointments.push({
    ...seed,
    id: "two",
    date: day,
    time: "10:00",
    duration: 60,
  });
  expect(available(s, day, "09:00", 90)).toBe(false);
  expect(available(s, day, "11:00", 60)).toBe(true);
  expect(available(s, day, "10:00", 60, "one")).toBe(true);
  s.appointments[1].status = "cancelled";
  expect(available(s, day, "10:00", 60)).toBe(true);
});
