import type { NextRequest } from "next/server";

import {
  controllerAtualizarResponsavel,
  controllerExcluirResponsavel,
} from "../../../../../web/controllers/controller_responsavel";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ id: string }>;
};

/**
 * PUT /api/responsaveis/[id]
 */
export async function PUT(request: NextRequest, context: Params) {
  const { id } = await context.params;
  return controllerAtualizarResponsavel(request, id);
}

/**
 * DELETE /api/responsaveis/[id]
 */
export async function DELETE(_request: NextRequest, context: Params) {
  const { id } = await context.params;
  return controllerExcluirResponsavel(id);
}
