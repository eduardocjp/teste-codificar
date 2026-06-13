import type { NextRequest } from "next/server";

import { controllerLogout } from "../../../../../web/controllers/controller_auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/logout
 */
export async function POST(request: NextRequest) {
  return controllerLogout(request);
}
