import type { NextRequest } from "next/server";

import {
  controllerCriarChamado,
  controllerListarChamados,
} from "../../../../web/controllers/controller_chamado";

export const dynamic = "force-dynamic";

/**
 * GET /api/chamados
 */
export async function GET(request: NextRequest) {
  return controllerListarChamados(request);
}

/**
 * POST /api/chamados
 */
export async function POST(request: NextRequest) {
  return controllerCriarChamado(request);
}
