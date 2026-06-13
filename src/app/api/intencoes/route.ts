import type { NextRequest } from "next/server";

import {
  controllerCriarIntencao,
  controllerListarIntencoes,
} from "../../../../web/controllers/controller_intencao";

export const dynamic = "force-dynamic";

/**
 * GET /api/intencoes
 */
export async function GET(request: NextRequest) {
  return controllerListarIntencoes(request);
}

/**
 * POST /api/intencoes
 */
export async function POST(request: NextRequest) {
  return controllerCriarIntencao(request);
}
