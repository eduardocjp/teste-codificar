import { controllerConectarEvolution } from "../../../../../web/controllers/controller_evolution";

export const dynamic = "force-dynamic";

/**
 * POST /api/whatsapp/conectar
 */
export async function POST() {
  return controllerConectarEvolution();
}
