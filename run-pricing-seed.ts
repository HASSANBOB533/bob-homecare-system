import { seedPricingData } from "./server/pricing-seed";

async function runSeed() {
  try {
    console.log("Running pricing seed...\n");
    const result = await seedPricingData();
    console.log("\n✅ Seed completed successfully!");
    console.log("Result:", result);
  } catch (error) {
    console.error("❌ Seed failed:", error);
  }
  
  process.exit(0);
}

runSeed();
