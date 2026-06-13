import type { NextRequest } from "next/server";

import { controllerLogin } from "../../../../../web/controllers/controller_auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/login
 */
export async function POST(request: NextRequest) {
  return controllerLogin(request);
}
