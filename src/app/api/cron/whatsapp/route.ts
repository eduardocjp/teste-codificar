import type { NextRequest } from "next/server";

import { controllerCronWhatsapp } from "../../../../../web/controllers/controller_whatsapp";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/whatsapp
 *
 * Mantido para chamadas manuais ou rotinas externas que usem GET.
 */
export async function GET(request: NextRequest) {
  return controllerCronWhatsapp(request);
}

/**
 * POST /api/cron/whatsapp
 *
 * Usado pelo Supabase Cron via pg_net para processar protocolos pendentes.
 */
export async function POST(request: NextRequest) {
  return controllerCronWhatsapp(request);
}
