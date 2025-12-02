import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { services } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

const sampleImages = [
  "/gallery/cleaning-team-1.jpg",
  "/gallery/cleaning-professional-2.jpg",
  "/gallery/cleaning-room-4.jpg",
  "/gallery/before-after-5.jpg",
];

async function addGalleryImages() {
  console.log("Adding sample gallery images to services...");

  // Get all services
  const allServices = await db.select().from(services);
  
  console.log(`Found ${allServices.length} services`);

  for (const service of allServices) {
    // Skip test services
    if (service.name.includes("Test")) {
      console.log(`Skipping test service: ${service.name}`);
      continue;
    }

    // Add gallery images to each service
    await db
      .update(services)
      .set({
        galleryImages: JSON.stringify(sampleImages),
      })
      .where(eq(services.id, service.id));

    console.log(`✓ Added gallery images to: ${service.name}`);
  }

  console.log("\n✅ Gallery images added successfully!");
  await connection.end();
}

addGalleryImages().catch((error) => {
  console.error("Error adding gallery images:", error);
  process.exit(1);
});
