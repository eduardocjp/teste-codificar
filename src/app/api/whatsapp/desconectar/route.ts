import { controllerDesconectarEvolution } from "../../../../../web/controllers/controller_evolution";

export const dynamic = "force-dynamic";

/**
 * POST /api/whatsapp/desconectar
 */
export async function POST() {
  return controllerDesconectarEvolution();
}
