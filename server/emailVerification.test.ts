import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";

describe("email verification procedures", () => {
  it("allows authenticated user to send verification email", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: 1,
        openId: "test-user",
        name: "Test User",
        email: "test@example.com",
        emailVerified: null,
        verificationToken: null,
        phone: null,
        role: "user",
        loginMethod: "email",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.auth.sendVerificationEmail();

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.token).toBeDefined();
  });

  // Note: In test environment, getUserById returns the user from context,
  // so we can't test the "no email" case without mocking the database

  it("verifies email with valid token", async () => {
    // First, generate a token
    const authCaller = appRouter.createCaller({
      user: {
        id: 1,
        openId: "test-user",
        name: "Test User",
        email: "test@example.com",
        emailVerified: null,
        verificationToken: null,
        phone: null,
        role: "user",
        loginMethod: "email",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: {} as any,
      res: {} as any,
    });

    const { token } = await authCaller.auth.sendVerificationEmail();

    // Then verify with the token
    const publicCaller = appRouter.createCaller({
      user: undefined,
      req: {} as any,
      res: {} as any,
    });

    const result = await publicCaller.auth.verifyEmail({ token });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it("fails to verify email with invalid token", async () => {
    const publicCaller = appRouter.createCaller({
      user: undefined,
      req: {} as any,
      res: {} as any,
    });

    await expect(
      publicCaller.auth.verifyEmail({ token: "invalid-token" })
    ).rejects.toThrow("Invalid or expired verification token");
  });

  it("requires authentication to send verification email", async () => {
    const caller = appRouter.createCaller({
      user: undefined,
      req: {} as any,
      res: {} as any,
    });

    await expect(caller.auth.sendVerificationEmail()).rejects.toThrow();
  });
});
