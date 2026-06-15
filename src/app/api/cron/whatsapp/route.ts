import type { NextRequest } from "next/server";

import { controllerCronWhatsapp } from "../../../../../web/controllers/controller_whatsapp";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/whatsapp
 *
 * A Vercel dispara cron jobs por GET e envia Authorization: Bearer CRON_SECRET
 * quando a variável CRON_SECRET está configurada no projeto.
 */
export async function GET(request: NextRequest) {
  return controllerCronWhatsapp(request);
}

/**
 * POST /api/cron/whatsapp
 *
 * Mantido para execução manual por ferramentas como Postman ou curl.
 */
export async function POST(request: NextRequest) {
  return controllerCronWhatsapp(request);
}
