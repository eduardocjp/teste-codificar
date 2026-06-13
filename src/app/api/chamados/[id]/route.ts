import type { NextRequest } from "next/server";

import {
  controllerAtualizarChamado,
  controllerBuscarChamado,
} from "../../../../../web/controllers/controller_chamado";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/chamados/[id]
 */
export async function GET(_request: NextRequest, context: Params) {
  const { id } = await context.params;
  return controllerBuscarChamado(id);
}

/**
 * PUT /api/chamados/[id]
 */
export async function PUT(request: NextRequest, context: Params) {
  const { id } = await context.params;
  return controllerAtualizarChamado(request, id);
}
