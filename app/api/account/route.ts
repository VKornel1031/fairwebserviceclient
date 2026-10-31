import type { NextRequest } from "next/server";
import { handle, updateProfile } from "@/lib/server/account-handlers";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function PATCH(request: NextRequest) {
  return handle(request, () => updateProfile(request), true);
}
