import type { NextRequest } from "next/server";
import { handle } from "@/lib/server/account-handlers";
import { appointmentDocument } from "@/lib/server/live-appointments";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; document: string }> },
) {
  return handle(request, async () => {
    const { id, document } = await context.params;
    return appointmentDocument(request, id, document);
  });
}
