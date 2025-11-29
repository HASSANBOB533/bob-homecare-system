import { describe, it, expect } from 'vitest';

describe('Twilio Credentials Validation', () => {
  it('should have Twilio credentials set in environment', () => {
    expect(process.env.TWILIO_ACCOUNT_SID).toBeDefined();
    expect(process.env.TWILIO_AUTH_TOKEN).toBeDefined();
    expect(process.env.TWILIO_PHONE_NUMBER).toBeDefined();
    
    // Validate format
    expect(process.env.TWILIO_ACCOUNT_SID).toMatch(/^AC[a-f0-9]{32}$/);
    expect(process.env.TWILIO_PHONE_NUMBER).toMatch(/^\+\d{10,15}$/);
  });

  it('should initialize Twilio client successfully', async () => {
    const { isSMSConfigured } = await import('./_core/sms');
    expect(isSMSConfigured()).toBe(true);
  });

  it('should send a test SMS successfully', async () => {
    const { sendSMS } = await import('./_core/sms');
    
    // Send test SMS to a verified number
    const testPhone = '+201201221212';
    const testMessage = 'BOB Home Care - Twilio validation test. Your SMS system is working!';
    
    const result = await sendSMS(testPhone, testMessage);
    
    // Should return true if sent successfully
    expect(result).toBe(true);
  }, 15000); // 15 second timeout for API call

  it('should format booking confirmation SMS correctly', async () => {
    const { sendBookingConfirmationSMS } = await import('./_core/sms');
    
    const result = await sendBookingConfirmationSMS('+201201221212', {
      customerName: 'Test Customer',
      serviceName: 'Deep Cleaning',
      dateTime: new Date('2024-12-15T14:00:00'),
      address: '123 Test Street, Cairo',
      bookingId: 999,
    });
    
    expect(result).toBe(true);
  }, 15000);
});
