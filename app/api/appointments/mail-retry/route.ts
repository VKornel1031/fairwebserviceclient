import type { NextRequest } from "next/server";
import { handle } from "@/lib/server/account-handlers";
import { appointmentProxy } from "@/lib/server/live-appointments";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  return handle(request, () => appointmentProxy(request, "mailRetry"), true);
}
