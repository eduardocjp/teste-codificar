import type { NextRequest } from "next/server";

import { controllerWebhookEvolution } from "../../../../../web/controllers/controller_evolution";

export const dynamic = "force-dynamic";

/**
 * POST /api/evolution/webhook
 */
export async function POST(request: NextRequest) {
  return controllerWebhookEvolution(request);
}
