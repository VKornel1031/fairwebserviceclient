import type { NextRequest } from "next/server";
import { handle } from "@/lib/server/account-handlers";
import { appointmentProxy } from "@/lib/server/live-appointments";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  return handle(request, async () => appointmentProxy(request, "list"), false);
}
export async function POST(request: NextRequest) {
  return handle(request, async () => appointmentProxy(request, "create"), true);
}
