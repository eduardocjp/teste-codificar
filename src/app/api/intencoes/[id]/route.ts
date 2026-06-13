import type { NextRequest } from "next/server";

import {
  controllerAtualizarIntencao,
  controllerDesativarIntencao,
} from "../../../../../web/controllers/controller_intencao";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ id: string }>;
};

/**
 * PUT /api/intencoes/[id]
 */
export async function PUT(request: NextRequest, context: Params) {
  const { id } = await context.params;
  return controllerAtualizarIntencao(request, id);
}

/**
 * DELETE /api/intencoes/[id]
 */
export async function DELETE(_request: NextRequest, context: Params) {
  const { id } = await context.params;
  return controllerDesativarIntencao(id);
}
