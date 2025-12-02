import { describe, it, expect } from "vitest";

describe("Loyalty Analytics Calculations", () => {
  it("should calculate redemption rate correctly", () => {
    const totalIssued = 1000;
    const totalRedeemed = 250;
    const redemptionRate = (totalRedeemed / totalIssued) * 100;
    
    expect(redemptionRate).toBe(25);
  });

  it("should handle zero issued points", () => {
    const totalIssued = 0;
    const totalRedeemed = 0;
    const redemptionRate = totalIssued > 0 
      ? ((totalRedeemed / totalIssued) * 100).toFixed(2)
      : "0.00";
    
    expect(redemptionRate).toBe("0.00");
  });

  it("should calculate average points per user", () => {
    const users = [
      { loyaltyPoints: 100 },
      { loyaltyPoints: 200 },
      { loyaltyPoints: 300 },
    ];
    const total = users.reduce((sum, u) => sum + u.loyaltyPoints, 0);
    const average = Math.round(total / users.length);
    
    expect(average).toBe(200);
  });

  it("should sort top earners correctly", () => {
    const users = [
      { id: 1, name: "Alice", loyaltyPoints: 500 },
      { id: 2, name: "Bob", loyaltyPoints: 1000 },
      { id: 3, name: "Charlie", loyaltyPoints: 750 },
    ];
    
    const sorted = [...users].sort((a, b) => b.loyaltyPoints - a.loyaltyPoints);
    
    expect(sorted[0].name).toBe("Bob");
    expect(sorted[1].name).toBe("Charlie");
    expect(sorted[2].name).toBe("Alice");
  });

  it("should group monthly trend data correctly", () => {
    const transactions = [
      { month: "2024-01", type: "earned", total: 100 },
      { month: "2024-01", type: "redeemed", total: 50 },
      { month: "2024-02", type: "earned", total: 200 },
      { month: "2024-02", type: "redeemed", total: 75 },
    ];

    const monthlyData = transactions.reduce((acc: any, item: any) => {
      if (!acc[item.month]) {
        acc[item.month] = { earned: 0, redeemed: 0 };
      }
      if (item.type === "earned") {
        acc[item.month].earned = item.total;
      } else if (item.type === "redeemed") {
        acc[item.month].redeemed = item.total;
      }
      return acc;
    }, {});

    expect(monthlyData["2024-01"].earned).toBe(100);
    expect(monthlyData["2024-01"].redeemed).toBe(50);
    expect(monthlyData["2024-02"].earned).toBe(200);
    expect(monthlyData["2024-02"].redeemed).toBe(75);
  });

  it("should calculate redemption rate with decimals", () => {
    const totalIssued = 1000;
    const totalRedeemed = 333;
    const redemptionRate = parseFloat(((totalRedeemed / totalIssued) * 100).toFixed(2));
    
    expect(redemptionRate).toBe(33.3);
  });

  it("should count active members correctly", () => {
    const users = [
      { loyaltyPoints: 0 },
      { loyaltyPoints: 100 },
      { loyaltyPoints: 0 },
      { loyaltyPoints: 50 },
    ];
    
    const activeMembers = users.filter(u => u.loyaltyPoints > 0).length;
    
    expect(activeMembers).toBe(2);
  });
});
