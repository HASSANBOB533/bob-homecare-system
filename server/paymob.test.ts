import { describe, it, expect } from 'vitest';
import { getPaymobAuthToken } from './_core/paymob';

describe('Paymob Integration', () => {
  it('should authenticate with Paymob API successfully', async () => {
    // Test authentication - this will validate the API key
    const authToken = await getPaymobAuthToken();
    
    // Auth token should be a non-empty string
    expect(authToken).toBeDefined();
    expect(typeof authToken).toBe('string');
    expect(authToken.length).toBeGreaterThan(0);
    
    console.log('✓ Paymob authentication successful');
    console.log('✓ API Key is valid');
  }, 30000); // 30 second timeout for API call
});
