import type { NextRequest } from "next/server";
import { authGet, authPost, handle } from "@/lib/server/account-handlers";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ action: string }> };
export async function GET(request: NextRequest, context: Context) {
  return handle(request, async () => authGet((await context.params).action));
}
export async function POST(request: NextRequest, context: Context) {
  return handle(
    request,
    async () => authPost(request, (await context.params).action),
    true,
  );
}
