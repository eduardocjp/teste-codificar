import type { NextRequest } from "next/server";

import { controllerIntentSolver } from "../../../../web/controllers/controller_intent_solver";

export const dynamic = "force-dynamic";

/**
 * POST /api/intent-solver
 */
export async function POST(request: NextRequest) {
  return controllerIntentSolver(request);
}
