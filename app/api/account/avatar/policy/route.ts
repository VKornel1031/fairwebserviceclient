import type { NextRequest } from "next/server";
import { handle } from "@/lib/server/account-handlers";
import { getAvatarPolicy } from "@/lib/server/avatars";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  return handle(request, getAvatarPolicy);
}
