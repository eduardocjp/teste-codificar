import type { NextRequest } from "next/server";

import { controllerWebhookEvolution } from "../../../../../web/controllers/controller_webhook_evolution";

export const dynamic = "force-dynamic";

/**
 * POST /api/webhook/evolution
 */
export async function POST(request: NextRequest) {
  void request;
  return controllerWebhookEvolution();
}
