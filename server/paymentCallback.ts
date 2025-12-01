/**
 * Paymob Payment Callback Handler
 * 
 * This file handles payment callbacks from Paymob after a payment is processed.
 * It verifies the HMAC signature and updates the booking status accordingly.
 */

import type { Request, Response } from "express";
import { verifyPaymobHMAC } from "./_core/paymob";
import { updateBookingPayment, getBookingById } from "./db";

export async function handlePaymobCallback(req: Request, res: Response) {
  try {
    const callbackData = req.body;

    console.log("[Paymob] Received callback:", JSON.stringify(callbackData, null, 2));

    // Verify HMAC signature
    const isValid = verifyPaymobHMAC(callbackData);
    if (!isValid) {
      console.error("[Paymob] Invalid HMAC signature");
      return res.status(400).json({ error: "Invalid signature" });
    }

    // Extract payment information
    const transactionId = callbackData.id;
    const success = callbackData.success === "true" || callbackData.success === true;
    const orderId = callbackData.order?.id || callbackData.order;
    const amountCents = callbackData.amount_cents;

    console.log("[Paymob] Transaction:", {
      transactionId,
      success,
      orderId,
      amountCents,
    });

    // Extract booking ID from merchant_order_id (format: booking_{id}_{timestamp})
    const merchantOrderId = callbackData.order?.merchant_order_id || callbackData.merchant_order_id;
    const bookingIdMatch = merchantOrderId?.match(/booking_(\d+)_/);
    
    if (!bookingIdMatch) {
      console.error("[Paymob] Could not extract booking ID from merchant_order_id:", merchantOrderId);
      return res.status(400).json({ error: "Invalid merchant order ID" });
    }

    const bookingId = parseInt(bookingIdMatch[1]);

    // Update booking payment status
    await updateBookingPayment(bookingId, {
      paymentId: transactionId.toString(),
      paymentStatus: success ? "success" : "failed",
      amount: amountCents,
    });

    // If payment successful, update booking status to confirmed
    if (success) {
      const { updateBooking } = await import("./db");
      await updateBooking(bookingId, {
        status: "confirmed",
      });

      console.log(`[Paymob] Payment successful for booking ${bookingId}`);

      // TODO: Send confirmation notification (WhatsApp/Email)
    } else {
      console.log(`[Paymob] Payment failed for booking ${bookingId}`);
    }

    // Respond to Paymob
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("[Paymob] Callback error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Handle payment response page (user redirect after payment)
 */
export async function handlePaymobResponse(req: Request, res: Response) {
  try {
    const queryData = req.query;

    console.log("[Paymob] Response page accessed:", JSON.stringify(queryData, null, 2));

    // Extract payment information from query parameters
    const success = queryData.success === "true";
    const merchantOrderId = queryData.merchant_order_id as string;

    // Extract booking ID
    const bookingIdMatch = merchantOrderId?.match(/booking_(\d+)_/);
    const bookingId = bookingIdMatch ? parseInt(bookingIdMatch[1]) : null;

    // Redirect to appropriate page based on payment status
    const frontendUrl = process.env.VITE_APP_URL || "http://localhost:3000";
    
    if (success && bookingId) {
      // Redirect to success page with booking ID
      return res.redirect(`${frontendUrl}/payment-success?bookingId=${bookingId}`);
    } else {
      // Redirect to failure page
      return res.redirect(`${frontendUrl}/payment-failed${bookingId ? `?bookingId=${bookingId}` : ""}`);
    }
  } catch (error) {
    console.error("[Paymob] Response error:", error);
    const frontendUrl = process.env.VITE_APP_URL || "http://localhost:3000";
    return res.redirect(`${frontendUrl}/payment-failed`);
  }
}
