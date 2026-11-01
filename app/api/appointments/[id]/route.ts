import type { NextRequest } from "next/server";
import { handle } from "@/lib/server/account-handlers";
import { appointmentProxy } from "@/lib/server/live-appointments";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return handle(
    request,
    async () => appointmentProxy(request, "detail", (await context.params).id),
    false,
  );
}
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return handle(
    request,
    async () =>
      appointmentProxy(request, "reschedule", (await context.params).id),
    true,
  );
}
