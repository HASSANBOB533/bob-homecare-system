import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { users } from './drizzle/schema.js';
import { eq } from 'drizzle-orm';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

const ownerOpenId = process.env.OWNER_OPEN_ID;
const ownerName = process.env.OWNER_NAME;

console.log(`Granting admin access to owner: ${ownerName} (${ownerOpenId})`);

const result = await db
  .update(users)
  .set({ role: 'admin' })
  .where(eq(users.openId, ownerOpenId));

console.log(`✅ Admin access granted! Affected rows: ${result[0].affectedRows}`);

// Verify
const owner = await db.select().from(users).where(eq(users.openId, ownerOpenId));
console.log(`Owner user:`, owner[0]);

await connection.end();
process.exit(0);
