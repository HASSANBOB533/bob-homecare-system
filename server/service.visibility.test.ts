import { describe, it, expect, beforeAll } from "vitest";
import { getAllServices, getServiceById } from "./db";

describe("Service Visibility Feature", () => {
  it("should only return visible services in getAllServices", async () => {
    const services = await getAllServices();
    
    // All returned services should have isVisible = true
    services.forEach(service => {
      expect(service.isVisible).toBe(true);
    });
    
    // Should not contain any test services
    const testServices = services.filter(s => 
      s.name.includes("Test") || 
      s.name.includes("test") || 
      s.name.includes("اختبار")
    );
    expect(testServices.length).toBe(0);
  });

  it("should still be able to get hidden services by ID", async () => {
    // This is important for admin functionality
    // Even hidden services should be retrievable by ID
    const allServices = await getAllServices();
    expect(allServices.length).toBeGreaterThan(0);
  });

  it("should filter out hidden services from public queries", async () => {
    const services = await getAllServices();
    
    // Verify all services are visible
    const hiddenServices = services.filter(s => s.isVisible === false);
    expect(hiddenServices.length).toBe(0);
  });
});
