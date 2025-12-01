import { describe, it, expect, beforeAll } from 'vitest';
import { getPaymobAuthToken, createPaymobOrder, getPaymobPaymentKey } from './_core/paymob';

describe('Paymob Payment Integration', () => {
  let authToken: string;
  
  beforeAll(async () => {
    // Authenticate once for all tests
    authToken = await getPaymobAuthToken();
  });

  it('should authenticate with Paymob successfully', async () => {
    expect(authToken).toBeDefined();
    expect(typeof authToken).toBe('string');
    expect(authToken.length).toBeGreaterThan(0);
  });

  it('should create a Paymob order', async () => {
    const orderId = await createPaymobOrder(
      authToken,
      10000, // 100 EGP in cents
      `TEST-${Date.now()}`,
      [{ name: 'Test Service', amount_cents: 10000, quantity: 1 }]
    );
    
    expect(orderId).toBeDefined();
    expect(typeof orderId).toBe('number');
    expect(orderId).toBeGreaterThan(0);
  }, 30000);

  it('should generate a payment key', async () => {
    // First create an order
    const orderId = await createPaymobOrder(
      authToken,
      10000,
      `TEST-${Date.now()}`,
      [{ name: 'Test Service', amount_cents: 10000, quantity: 1 }]
    );

    // Then generate payment key
    const paymentKey = await getPaymobPaymentKey(
      authToken,
      orderId,
      10000,
      {
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        phone_number: '+201234567890',
        city: 'Cairo',
        country: 'EG',
        street: 'Test Street',
        building: '123',
        floor: '1',
        apartment: '1A',
      }
    );

    expect(paymentKey).toBeDefined();
    expect(typeof paymentKey).toBe('string');
    expect(paymentKey.length).toBeGreaterThan(0);
  }, 30000);
});
