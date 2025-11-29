import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '../drizzle/schema.js';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { schema, mode: 'default' });

const sampleRewards = [
  {
    name: 'خصم 10% على الحجز التالي',
    nameEn: '10% Off Next Booking',
    description: 'احصل على خصم 10% على حجزك التالي',
    descriptionEn: 'Get 10% discount on your next booking',
    pointsCost: 50,
    discountType: 'percentage',
    discountValue: 10,
    active: true,
  },
  {
    name: 'خصم 20% على الحجز التالي',
    nameEn: '20% Off Next Booking',
    description: 'احصل على خصم 20% على حجزك التالي',
    descriptionEn: 'Get 20% discount on your next booking',
    pointsCost: 100,
    discountType: 'percentage',
    discountValue: 20,
    active: true,
  },
  {
    name: 'خصم 100 جنيه',
    nameEn: '100 EGP Discount',
    description: 'احصل على خصم 100 جنيه على حجزك التالي',
    descriptionEn: 'Get 100 EGP off your next booking',
    pointsCost: 150,
    discountType: 'fixed',
    discountValue: 100,
    active: true,
  },
  {
    name: 'تنظيف مجاني لغرفة واحدة',
    nameEn: 'Free Single Room Cleaning',
    description: 'احصل على تنظيف مجاني لغرفة واحدة',
    descriptionEn: 'Get a free single room cleaning service',
    pointsCost: 200,
    discountType: 'free_service',
    active: true,
  },
];

console.log('Seeding sample rewards...');

for (const reward of sampleRewards) {
  await db.insert(schema.rewards).values(reward);
  console.log(`✓ Created reward: ${reward.nameEn}`);
}

console.log('\n✅ Sample rewards seeded successfully!');
await connection.end();
