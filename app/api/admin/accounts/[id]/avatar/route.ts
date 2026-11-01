import type { NextRequest } from "next/server";
import { handle } from "@/lib/server/account-handlers";
import { getAvatar } from "@/lib/server/avatars";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return handle(request, async () =>
    getAvatar(request, (await context.params).id),
  );
}
