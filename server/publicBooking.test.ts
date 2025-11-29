import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: undefined,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("public booking procedures", () => {
  it("allows anyone to create a public booking", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // Get first available service
    const services = await caller.services.list();
    const serviceId = services.length > 0 ? services[0].id : undefined;

    const booking = await caller.bookings.createPublic({
      serviceId,
      date: "2025-12-01",
      time: "10:00",
      customerName: "Test Customer",
      phone: "+201234567890",
      customerEmail: "test@example.com",
      address: "123 Test Street, Cairo",
      notes: "Test booking",
    });

    expect(booking).toBeDefined();
    expect(booking.id).toBeDefined();
    expect(booking.customerName).toBe("Test Customer");
  });

  it("requires all mandatory fields for public booking", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const services = await caller.services.list();
    const serviceId = services.length > 0 ? services[0].id : undefined;

    await expect(
      caller.bookings.createPublic({
        serviceId,
        date: "2025-12-01",
        time: "10:00",
        customerName: "",
        phone: "+201234567890",
        address: "123 Test Street",
      })
    ).rejects.toThrow();
  });

  it("allows checking booking status with ID and phone", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const services = await caller.services.list();
    const serviceId = services.length > 0 ? services[0].id : undefined;

    // First create a booking
    const booking = await caller.bookings.createPublic({
      serviceId,
      date: "2025-12-01",
      time: "14:00",
      customerName: "Test Customer",
      phone: "+201234567890",
      address: "123 Test Street",
    });

    // Then check its status
    const status = await caller.bookings.checkStatus({
      id: booking.id,
      phone: "+201234567890",
    });

    expect(status).toBeDefined();
    expect(status?.customerName).toBe("Test Customer");
    expect(status?.status).toBe("pending");
  });

  it("returns null for non-existent booking", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const status = await caller.bookings.checkStatus({
      id: 99999,
      phone: "+201234567890",
    });

    expect(status).toBeNull();
  });

  it("returns null when phone number doesn't match", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const services = await caller.services.list();
    const serviceId = services.length > 0 ? services[0].id : undefined;

    // Create a booking
    const booking = await caller.bookings.createPublic({
      serviceId,
      date: "2025-12-01",
      time: "15:00",
      customerName: "Status Check Test",
      phone: "+201111111111",
      address: "456 Test Avenue",
    });

    // Try to check with wrong phone
    const status = await caller.bookings.checkStatus({
      id: booking.id,
      phone: "+209999999999",
    });

    expect(status).toBeNull();
  });
});
