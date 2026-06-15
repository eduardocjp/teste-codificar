import type { NextRequest } from "next/server";

import { controllerFinalizarConversaWhatsapp } from "../../../../../../web/controllers/controller_conversa";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/conversas/[id]/finalizar
 */
export async function POST(_request: NextRequest, context: Params) {
  const { id } = await context.params;
  return controllerFinalizarConversaWhatsapp(id);
}
