import { describe, it, expect } from "vitest";
import { validateReferralCode, getUserReferralCode } from "./db";

describe("Referral Code Validation", () => {
  it("should validate a valid unused referral code", async () => {
    // Get a referral code for user 1
    const referral = await getUserReferralCode(1);
    const result = await validateReferralCode(referral.referralCode);
    
    expect(result.valid).toBe(true);
    expect(result.referralId).toBeDefined();
    expect(result.referrerId).toBe(1);
  });

  it("should reject an invalid referral code", async () => {
    const result = await validateReferralCode("INVALID123");
    
    expect(result.valid).toBe(false);
    expect(result.message).toContain("Invalid");
  });

  it("should reject an empty referral code", async () => {
    const result = await validateReferralCode("");
    
    expect(result.valid).toBe(false);
  });
});

describe("Referral Code Generation", () => {
  it("should generate a unique 8-character referral code", async () => {
    const referral = await getUserReferralCode(1);
    
    expect(referral.referralCode).toBeDefined();
    expect(referral.referralCode.length).toBe(8);
    expect(referral.referralCode).toMatch(/^[A-Z0-9]+$/); // Only uppercase letters and numbers
  });

  it("should return existing code if user already has one", async () => {
    const referral1 = await getUserReferralCode(1);
    const referral2 = await getUserReferralCode(1);
    
    expect(referral1.referralCode).toBe(referral2.referralCode);
  });
});
