import type { NextRequest } from "next/server";
import { handle } from "@/lib/server/account-handlers";
import { deleteVehicle, updateVehicle } from "@/lib/server/vehicles";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: NextRequest, context: Context) {
  return handle(
    request,
    async () => updateVehicle(request, (await context.params).id),
    true,
  );
}
export async function DELETE(request: NextRequest, context: Context) {
  return handle(
    request,
    async () => deleteVehicle(request, (await context.params).id),
    true,
  );
}
