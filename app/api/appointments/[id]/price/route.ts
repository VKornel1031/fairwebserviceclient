import type { NextRequest } from "next/server";
import { handle } from "@/lib/server/account-handlers";
import { appointmentProxy } from "@/lib/server/live-appointments";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return handle(
    request,
    async () => appointmentProxy(request, "price", (await context.params).id),
    true,
  );
}
