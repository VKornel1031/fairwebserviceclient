import type { NextRequest } from "next/server";
import {
  createAccount,
  handle,
  listAccounts,
} from "@/lib/server/account-handlers";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  return handle(request, () => listAccounts(request));
}
export async function POST(request: NextRequest) {
  return handle(request, () => createAccount(request), true);
}
