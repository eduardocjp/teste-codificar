import type { NextRequest } from "next/server";

import { controllerCronWhatsapp } from "../../../../../web/controllers/controller_whatsapp";

export const dynamic = "force-dynamic";

/**
 * POST /api/cron/whatsapp
 */
export async function POST(request: NextRequest) {
  return controllerCronWhatsapp(request);
}
