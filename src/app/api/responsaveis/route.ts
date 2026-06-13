import type { NextRequest } from "next/server";

import {
  controllerCriarResponsavel,
  controllerListarResponsaveis,
} from "../../../../web/controllers/controller_responsavel";

export const dynamic = "force-dynamic";

/**
 * GET /api/responsaveis
 */
export async function GET(request: NextRequest) {
  return controllerListarResponsaveis(request);
}

/**
 * POST /api/responsaveis
 */
export async function POST(request: NextRequest) {
  return controllerCriarResponsavel(request);
}
