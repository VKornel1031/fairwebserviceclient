import type { NextRequest } from "next/server";
import { handle } from "@/lib/server/account-handlers";
import { appointmentProxy } from "@/lib/server/live-appointments";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  return handle(
    request,
    async () => appointmentProxy(request, "closures"),
    false,
  );
}
export async function PUT(request: NextRequest) {
  return handle(request, async () => appointmentProxy(request, "close"), true);
}
export async function DELETE(request: NextRequest) {
  return handle(request, async () => appointmentProxy(request, "open"), true);
}
