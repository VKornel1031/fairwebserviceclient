import type { NextRequest } from "next/server";
import { handle } from "@/lib/server/account-handlers";
import { garageSummary } from "@/lib/server/vehicles";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  return handle(request, () => garageSummary(request));
}
