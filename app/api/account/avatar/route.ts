import type { NextRequest } from "next/server";
import { handle } from "@/lib/server/account-handlers";
import { deleteAvatar, getAvatar, uploadAvatar } from "@/lib/server/avatars";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  return handle(request, () => getAvatar(request));
}
export async function PUT(request: NextRequest) {
  return handle(request, () => uploadAvatar(request), true);
}
export async function DELETE(request: NextRequest) {
  return handle(request, () => deleteAvatar(request), true);
}
