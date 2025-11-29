import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";

describe("profile update procedures", () => {
  it("allows authenticated user to update their profile", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: 1,
        openId: "test-user",
        name: "Test User",
        email: "test@example.com",
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

    const result = await caller.auth.updateProfile({
      name: "Updated Name",
      email: "updated@example.com",
      phone: "+20 123 456 7890",
    });

    expect(result).toBeDefined();
    expect(result.name).toBe("Updated Name");
    expect(result.email).toBe("updated@example.com");
    expect(result.phone).toBe("+20 123 456 7890");
  });

  it("allows partial profile updates", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: 1,
        openId: "test-user",
        name: "Test User",
        email: "test@example.com",
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

    const result = await caller.auth.updateProfile({
      phone: "+20 987 654 3210",
    });

    expect(result).toBeDefined();
    expect(result.phone).toBe("+20 987 654 3210");
  });

  it("requires authentication to update profile", async () => {
    const caller = appRouter.createCaller({
      user: undefined,
      req: {} as any,
      res: {} as any,
    });

    await expect(
      caller.auth.updateProfile({
        name: "New Name",
      })
    ).rejects.toThrow();
  });
});
