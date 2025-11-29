import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const services = [
  { name: 'Carpet Cleaning', description: 'Professional carpet cleaning service', price: 8000, duration: 120 },
  { name: 'Window Cleaning', description: 'Streak-free window cleaning', price: 5000, duration: 90 },
  { name: 'Deep Cleaning', description: 'Thorough deep cleaning of your home', price: 15000, duration: 240 },
  { name: 'Sofa Cleaning', description: 'Professional upholstery cleaning', price: 6000, duration: 90 },
];

async function seed() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    console.log('Seeding services...');
    
    for (const service of services) {
      await connection.execute(
        'INSERT INTO services (name, description, price, duration) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE description = VALUES(description), price = VALUES(price), duration = VALUES(duration)',
        [service.name, service.description, service.price, service.duration]
      );
    }
    
    console.log('✅ Services seeded successfully!');
  } catch (error) {
    console.error('Error seeding services:', error);
  } finally {
    await connection.end();
  }
}

seed();
