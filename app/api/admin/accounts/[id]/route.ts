import type { NextRequest } from "next/server";
import { handle, modifyAccount } from "@/lib/server/account-handlers";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: NextRequest, context: Context) {
  return handle(
    request,
    async () => modifyAccount(request, (await context.params).id),
    true,
  );
}
export async function DELETE(request: NextRequest, context: Context) {
  return handle(
    request,
    async () => modifyAccount(request, (await context.params).id, true),
    true,
  );
}
