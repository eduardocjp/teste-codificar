import type { NextRequest } from "next/server";

import { controllerCapturaSimulada } from "../../../../../web/controllers/controller_simulador";

export const dynamic = "force-dynamic";

/**
 * POST /api/simulador/captura
 */
export async function POST(request: NextRequest) {
  return controllerCapturaSimulada(request);
}
