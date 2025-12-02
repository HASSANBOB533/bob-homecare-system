import { getServicePricingData } from "./server/db";

async function testPricingQuery() {
  try {
    console.log("Testing pricing query for Service Apartments (ID: 9)...");
    const result = await getServicePricingData(9);
    console.log("Result:", JSON.stringify(result, null, 2));
    
    console.log("\nService:", result.service);
    console.log("Pricing Type:", result.service.pricingType);
    console.log("Pricing Data:", result.pricing);
    
    if (result.service.pricingType === "BEDROOM_BASED") {
      console.log("\nBedroom Tiers:", result.pricing.tiers);
    }
  } catch (error) {
    console.error("Error:", error);
  }
  
  process.exit(0);
}

testPricingQuery();
