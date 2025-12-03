import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

// Database connection
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Import schema
const { timeSlots } = await import('../drizzle/schema.ts');

/**
 * Seed time slots for the next 60 days
 */
async function seedTimeSlots() {
  console.log('🌱 Seeding time slots for the next 60 days...');

  const today = new Date();
  const slotsToInsert = [];

  // Default time slots (9 AM to 5 PM with 2-hour intervals)
  const defaultSlots = [
    { startTime: '09:00:00', endTime: '11:00:00' },
    { startTime: '11:00:00', endTime: '13:00:00' },
    { startTime: '13:00:00', endTime: '15:00:00' },
    { startTime: '15:00:00', endTime: '17:00:00' },
  ];

  // Generate slots for next 60 days
  for (let i = 0; i < 60; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    // Skip Fridays (day 5 in JavaScript, where Sunday = 0)
    if (date.getDay() === 5) {
      console.log(`⏭️  Skipping Friday: ${date.toISOString().split('T')[0]}`);
      continue;
    }

    // Add all time slots for this date
    for (const slot of defaultSlots) {
      slotsToInsert.push({
        date: date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        capacity: 3, // Allow 3 concurrent bookings per slot
        bookedCount: 0,
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  console.log(`📅 Inserting ${slotsToInsert.length} time slots...`);

  // Insert in batches of 100 to avoid overwhelming the database
  const batchSize = 100;
  for (let i = 0; i < slotsToInsert.length; i += batchSize) {
    const batch = slotsToInsert.slice(i, i + batchSize);
    await db.insert(timeSlots).values(batch);
    console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(slotsToInsert.length / batchSize)}`);
  }

  console.log('✅ Time slots seeded successfully!');
  console.log(`📊 Total slots created: ${slotsToInsert.length}`);
  console.log(`📆 Date range: ${today.toISOString().split('T')[0]} to ${new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}`);
}

// Run the seed function
seedTimeSlots()
  .then(() => {
    console.log('🎉 Seeding complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error seeding time slots:', error);
    process.exit(1);
  });
