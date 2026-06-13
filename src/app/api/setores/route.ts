import { controllerListarSetores } from "../../../../web/controllers/controller_setor";

export const dynamic = "force-dynamic";

/**
 * GET /api/setores
 */
export async function GET() {
  return controllerListarSetores();
}
