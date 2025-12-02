import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Import schema dynamically to avoid TypeScript issues
const schema = await import("../drizzle/schema.js");
const { services } = schema;

console.log("Fetching services from database...\n");

const allServices = await db
  .select({
    id: services.id,
    name: services.name,
    nameEn: services.nameEn,
    galleryImages: services.galleryImages,
  })
  .from(services)
  .limit(10);

console.log(`Found ${allServices.length} services:\n`);

allServices.forEach((service) => {
  console.log(`ID: ${service.id}`);
  console.log(`Name: ${service.name}`);
  console.log(`Name (EN): ${service.nameEn || "N/A"}`);
  console.log(`Gallery Images: ${service.galleryImages ? JSON.stringify(service.galleryImages) : "None"}`);
  console.log("---");
});

await connection.end();
