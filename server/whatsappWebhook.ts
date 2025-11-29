import { Router } from "express";
import type { Request, Response } from "express";

const router = Router();

/**
 * WhatsApp Webhook Verification
 * Meta requires webhook verification during setup
 */
router.get("/webhook", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  // Verify token should match what you set in Meta App Dashboard
  const VERIFY_TOKEN = process.env.META_WHATSAPP_VERIFY_TOKEN || "BOB_HOME_CARE_VERIFY_TOKEN_2024";

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[WhatsApp Webhook] Verification successful");
    res.status(200).send(challenge);
  } else {
    console.log("[WhatsApp Webhook] Verification failed");
    res.sendStatus(403);
  }
});

/**
 * WhatsApp Webhook Handler
 * Receives incoming messages from customers
 */
router.post("/webhook", async (req: Request, res: Response) => {
  try {
    const body = req.body;

    // Check if this is a WhatsApp message event
    if (body.object === "whatsapp_business_account") {
      // Acknowledge receipt immediately
      res.sendStatus(200);

      // Process webhook entries
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field === "messages") {
            const value = change.value;

            // Extract message details
            if (value.messages && value.messages.length > 0) {
              const message = value.messages[0];
              const from = message.from; // Customer's phone number
              const messageBody = message.text?.body || "";
              const messageId = message.id;

              console.log(`[WhatsApp] Received message from ${from}: ${messageBody}`);

              // Process the message (will be handled by chatbot logic)
              await handleIncomingMessage(from, messageBody, messageId);
            }

            // Handle message status updates (sent, delivered, read)
            if (value.statuses && value.statuses.length > 0) {
              const status = value.statuses[0];
              console.log(`[WhatsApp] Message status update:`, status);
            }
          }
        }
      }
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    console.error("[WhatsApp Webhook] Error processing webhook:", error);
    res.sendStatus(500);
  }
});

/**
 * Handle incoming WhatsApp messages
 * This will be expanded with chatbot logic
 */
async function handleIncomingMessage(
  from: string,
  messageBody: string,
  messageId: string
): Promise<void> {
  // Import chatbot handler (will be created next)
  const { processChatbotMessage } = await import("./whatsappChatbot");
  await processChatbotMessage(from, messageBody, messageId);
}

export default router;
