import { controllerWebhookEmailPostmark } from "../../../../../../web/controllers/controller_webhook_email";

export const dynamic = "force-dynamic";

/**
 * POST /api/webhook/email/postmark
 */
export async function POST() {
  return controllerWebhookEmailPostmark();
}
