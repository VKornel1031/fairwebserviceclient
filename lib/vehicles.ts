import type { Vehicle } from "./demo";

export type SavedVehicle = Vehicle & { ownerName: string; updated: string };
export type VehicleList = {
  items: SavedVehicle[];
  page: number;
  totalPages: number;
  totalItems: number;
};
export type GarageSummary = {
  ownerId: string;
  totalItems: number;
  defaultVehicle: SavedVehicle | null;
};
export function normalisePlate(value: string) {
  return value.trim().toUpperCase().replace(/[\s-]/g, "");
}
export function displayPlate(value: string) {
  return /^[A-Z]{3}\d{3}$/.test(value)
    ? value.slice(0, 3) + "-" + value.slice(3)
    : value;
}
