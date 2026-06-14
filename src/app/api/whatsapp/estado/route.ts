import { controllerStatusEvolution } from "../../../../../web/controllers/controller_evolution";

export const dynamic = "force-dynamic";

/**
 * GET /api/whatsapp/estado
 */
export async function GET() {
  return controllerStatusEvolution();
}
