/**
 * Paymob Payment Gateway Integration
 * 
 * This module provides functions to integrate with Paymob (Accept) payment gateway
 * for processing online payments in Egypt.
 * 
 * Required environment variables:
 * - PAYMOB_API_KEY: Your Paymob API key
 * - PAYMOB_INTEGRATION_ID: Integration ID for card payments
 * - PAYMOB_IFRAME_ID: Iframe ID for payment page
 * - PAYMOB_HMAC_SECRET: HMAC secret for callback verification
 */

const PAYMOB_BASE_URL = "https://accept.paymob.com/api";

interface PaymobAuthResponse {
  token: string;
}

interface PaymobOrderResponse {
  id: number;
  merchant_order_id: string;
  amount_cents: number;
}

interface PaymobPaymentKeyResponse {
  token: string;
}

interface BillingData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  apartment?: string;
  floor?: string;
  street?: string;
  building?: string;
  shipping_method?: string;
  postal_code?: string;
  city?: string;
  country?: string;
  state?: string;
}

/**
 * Check if Paymob is configured with required credentials
 */
export function isPaymobConfigured(): boolean {
  return !!(
    process.env.PAYMOB_API_KEY &&
    process.env.PAYMOB_INTEGRATION_ID &&
    process.env.PAYMOB_IFRAME_ID &&
    process.env.PAYMOB_HMAC_SECRET
  );
}

/**
 * Authenticate with Paymob and get access token
 */
export async function getPaymobAuthToken(): Promise<string> {
  if (!process.env.PAYMOB_API_KEY) {
    throw new Error("Paymob API key not configured");
  }

  const response = await fetch(`${PAYMOB_BASE_URL}/auth/tokens`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: process.env.PAYMOB_API_KEY,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Paymob authentication failed: ${error}`);
  }

  const data: PaymobAuthResponse = await response.json();
  return data.token;
}

/**
 * Register an order with Paymob
 */
export async function createPaymobOrder(
  authToken: string,
  amountCents: number,
  merchantOrderId: string,
  items: Array<{ name: string; amount_cents: number; quantity: number }>
): Promise<number> {
  const response = await fetch(`${PAYMOB_BASE_URL}/ecommerce/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_token: authToken,
      delivery_needed: "false",
      amount_cents: amountCents,
      currency: "EGP",
      merchant_order_id: merchantOrderId,
      items,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Paymob order creation failed: ${error}`);
  }

  const data: PaymobOrderResponse = await response.json();
  return data.id;
}

/**
 * Generate payment key for checkout
 */
export async function getPaymobPaymentKey(
  authToken: string,
  orderId: number,
  amountCents: number,
  billingData: BillingData
): Promise<string> {
  if (!process.env.PAYMOB_INTEGRATION_ID) {
    throw new Error("Paymob integration ID not configured");
  }

  const response = await fetch(`${PAYMOB_BASE_URL}/acceptance/payment_keys`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_token: authToken,
      amount_cents: amountCents,
      expiration: 3600, // 1 hour
      order_id: orderId,
      billing_data: billingData,
      currency: "EGP",
      integration_id: parseInt(process.env.PAYMOB_INTEGRATION_ID),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Paymob payment key generation failed: ${error}`);
  }

  const data: PaymobPaymentKeyResponse = await response.json();
  return data.token;
}

/**
 * Get Paymob iframe URL for payment
 */
export function getPaymobIframeUrl(paymentToken: string): string {
  if (!process.env.PAYMOB_IFRAME_ID) {
    throw new Error("Paymob iframe ID not configured");
  }

  return `https://accept.paymob.com/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentToken}`;
}

/**
 * Verify HMAC signature from Paymob callback
 */
export function verifyPaymobHMAC(data: Record<string, any>): boolean {
  if (!process.env.PAYMOB_HMAC_SECRET) {
    throw new Error("Paymob HMAC secret not configured");
  }

  const crypto = require("crypto");
  const hmacSecret = process.env.PAYMOB_HMAC_SECRET;

  // Extract required fields in the correct order
  const concatenatedString = [
    data.amount_cents,
    data.created_at,
    data.currency,
    data.error_occured,
    data.has_parent_transaction,
    data.id,
    data.integration_id,
    data.is_3d_secure,
    data.is_auth,
    data.is_capture,
    data.is_refunded,
    data.is_standalone_payment,
    data.is_voided,
    data.order,
    data.owner,
    data.pending,
    data.source_data_pan,
    data.source_data_sub_type,
    data.source_data_type,
    data.success,
  ].join("");

  const calculatedHMAC = crypto
    .createHmac("sha512", hmacSecret)
    .update(concatenatedString)
    .digest("hex");

  return calculatedHMAC === data.hmac;
}

/**
 * Complete payment flow - authenticate, create order, and get payment key
 */
export async function initiatePaymobPayment(
  amountCents: number,
  bookingId: number,
  billingData: BillingData
): Promise<{ paymentToken: string; iframeUrl: string; orderId: number }> {
  // Step 1: Authenticate
  const authToken = await getPaymobAuthToken();

  // Step 2: Create order
  const merchantOrderId = `booking_${bookingId}_${Date.now()}`;
  const items = [
    {
      name: "Cleaning Service",
      amount_cents: amountCents,
      quantity: 1,
    },
  ];

  const orderId = await createPaymobOrder(authToken, amountCents, merchantOrderId, items);

  // Step 3: Generate payment key
  const paymentToken = await getPaymobPaymentKey(authToken, orderId, amountCents, billingData);

  // Step 4: Get iframe URL
  const iframeUrl = getPaymobIframeUrl(paymentToken);

  return {
    paymentToken,
    iframeUrl,
    orderId,
  };
}
