import type { NextRequest } from "next/server";

import { controllerDistribuicao } from "../../../../web/controllers/controller_chamado";

export const dynamic = "force-dynamic";

/**
 * POST /api/distribuicao
 */
export async function POST(request: NextRequest) {
  return controllerDistribuicao(request);
}
