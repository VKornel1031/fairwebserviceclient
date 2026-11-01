import type { NextRequest } from "next/server";
import { handle } from "@/lib/server/account-handlers";
import { chooseDefaultVehicle } from "@/lib/server/vehicles";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function PUT(request: NextRequest) {
  return handle(request, () => chooseDefaultVehicle(request), true);
}
