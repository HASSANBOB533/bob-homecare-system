import { drizzle } from 'drizzle-orm/mysql2';
import { users } from './drizzle/schema.ts';

const db = drizzle(process.env.DATABASE_URL);
const allUsers = await db.select().from(users);

console.log('\n=== Existing Users in Database ===\n');
allUsers.forEach(user => {
  console.log(`Name: ${user.name}`);
  console.log(`Email: ${user.email}`);
  console.log(`Role: ${user.role}`);
  console.log(`Login Method: ${user.loginMethod}`);
  console.log(`OpenID: ${user.openId}`);
  console.log(`Created: ${user.createdAt}`);
  console.log('---');
});

console.log(`\nTotal users: ${allUsers.length}\n`);
