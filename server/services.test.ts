import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-test",
    email: "admin@test.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "user-test",
    email: "user@test.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("services procedures", () => {
  it("allows anyone to list services", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const services = await caller.services.list();
    
    expect(Array.isArray(services)).toBe(true);
    expect(services.length).toBeGreaterThan(0);
  });

  it("allows admin to create service", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.services.create({
      name: "Test Service",
      description: "Test description",
      price: 10000,
      duration: 120,
    });

    expect(result).toBeDefined();
  });

  it("prevents non-admin from creating service", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.services.create({
        name: "Test Service",
        description: "Test description",
        price: 10000,
        duration: 120,
      })
    ).rejects.toThrow("Only admins can create services");
  });
});

describe("bookings procedures", () => {
  it("allows authenticated user to view their bookings", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    // Ensure user exists in database
    const { upsertUser } = await import("./db");
    await upsertUser({
      openId: ctx.user!.openId,
      name: ctx.user!.name,
      email: ctx.user!.email,
      role: ctx.user!.role,
    });

    const bookings = await caller.bookings.myBookings();
    
    expect(Array.isArray(bookings)).toBe(true);
  });

  it("allows admin to view all bookings", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const bookings = await caller.bookings.allBookings();
    
    expect(Array.isArray(bookings)).toBe(true);
  });

  it("prevents non-admin from viewing all bookings", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.bookings.allBookings()).rejects.toThrow(
      "Only admins can view all bookings"
    );
  });

  it("allows authenticated user to create booking", async () => {
    // Ensure user exists in database and get real ID
    const { upsertUser, getUserByOpenId } = await import("./db");
    await upsertUser({
      openId: "user-test",
      name: "Regular User",
      email: "user@test.com",
      role: "user",
    });
    
    const dbUser = await getUserByOpenId("user-test");
    if (!dbUser) throw new Error("User not found after upsert");

    const ctx = createUserContext();
    // Update context with real user ID from database
    ctx.user!.id = dbUser.id;
    const caller = appRouter.createCaller(ctx);

    const result = await caller.bookings.create({
      customerName: "Test Customer",
      address: "123 Test St",
      phone: "+1234567890",
      dateTime: new Date(Date.now() + 86400000), // Tomorrow
      notes: "Test booking",
    });

    expect(result).toBeDefined();
  });
});
