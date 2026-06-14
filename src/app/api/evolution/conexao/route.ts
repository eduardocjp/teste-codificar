import {
  controllerConectarEvolution,
  controllerDesconectarEvolution,
  controllerStatusEvolution,
} from "../../../../../web/controllers/controller_evolution";

export const dynamic = "force-dynamic";

/**
 * GET /api/evolution/conexao
 */
export async function GET() {
  return controllerStatusEvolution();
}

/**
 * POST /api/evolution/conexao
 */
export async function POST() {
  return controllerConectarEvolution();
}

/**
 * DELETE /api/evolution/conexao
 */
export async function DELETE() {
  return controllerDesconectarEvolution();
}
