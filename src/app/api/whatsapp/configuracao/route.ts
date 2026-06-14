import type { NextRequest } from "next/server";

import {
  controllerObterConfiguracaoWhatsapp,
  controllerSalvarConfiguracaoWhatsapp,
} from "../../../../../web/controllers/controller_whatsapp";

export const dynamic = "force-dynamic";

/**
 * GET /api/whatsapp/configuracao
 */
export async function GET() {
  return controllerObterConfiguracaoWhatsapp();
}

/**
 * PATCH /api/whatsapp/configuracao
 */
export async function PATCH(request: NextRequest) {
  return controllerSalvarConfiguracaoWhatsapp(request);
}
