import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Services queries
export async function getAllServices() {
  const db = await getDb();
  if (!db) return [];
  const { services } = await import("../drizzle/schema");
  return db.select().from(services);
}

export async function getServiceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const { services } = await import("../drizzle/schema");
  const result = await db.select().from(services).where(eq(services.id, id)).limit(1);
  return result[0];
}

export async function createService(service: {
  name: string;
  nameEn?: string;
  description?: string;
  descriptionEn?: string;
  duration?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { services } = await import("../drizzle/schema");
  const result = await db.insert(services).values(service);
  return result;
}

export async function deleteService(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { services } = await import("../drizzle/schema");
  await db.delete(services).where(eq(services.id, id));
}

// Bookings queries
export async function getUserBookings(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const { bookings, services } = await import("../drizzle/schema");
  return db.select({
    id: bookings.id,
    customerName: bookings.customerName,
    address: bookings.address,
    phone: bookings.phone,
    dateTime: bookings.dateTime,
    status: bookings.status,
    notes: bookings.notes,
    serviceId: bookings.serviceId,
    serviceName: services.name,
    createdAt: bookings.createdAt,
  }).from(bookings).leftJoin(services, eq(bookings.serviceId, services.id)).where(eq(bookings.userId, userId));
}

export async function getAllBookings() {
  const db = await getDb();
  if (!db) return [];
  const { bookings, services, users } = await import("../drizzle/schema");
  return db.select({
    id: bookings.id,
    customerName: bookings.customerName,
    address: bookings.address,
    phone: bookings.phone,
    dateTime: bookings.dateTime,
    status: bookings.status,
    notes: bookings.notes,
    serviceId: bookings.serviceId,
    serviceName: services.name,
    userName: users.name,
    userEmail: users.email,
    createdAt: bookings.createdAt,
  }).from(bookings)
    .leftJoin(services, eq(bookings.serviceId, services.id))
    .leftJoin(users, eq(bookings.userId, users.id));
}

export async function getBookingById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const { bookings } = await import("../drizzle/schema");
  const result = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  return result[0];
}

export async function getBookingByIdAndPhone(id: number, phone: string) {
  const db = await getDb();
  if (!db) return null;
  const { bookings, services } = await import("../drizzle/schema");
  const { and } = await import("drizzle-orm");
  const result = await db.select({
    id: bookings.id,
    customerName: bookings.customerName,
    customerEmail: bookings.customerEmail,
    address: bookings.address,
    phone: bookings.phone,
    dateTime: bookings.dateTime,
    status: bookings.status,
    notes: bookings.notes,
    serviceId: bookings.serviceId,
    serviceName: services.name,
    createdAt: bookings.createdAt,
  }).from(bookings)
    .leftJoin(services, eq(bookings.serviceId, services.id))
    .where(and(eq(bookings.id, id), eq(bookings.phone, phone)))
    .limit(1);
  return result[0] || null;
}

export async function createBooking(data: {
  userId: number;
  serviceId?: number;
  customerName: string;
  address: string;
  phone?: string;
  dateTime: Date;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { bookings } = await import("../drizzle/schema");
  const result = await db.insert(bookings).values(data);
  return result;
}

export async function createPublicBooking(data: {
  serviceId?: number;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  address: string;
  dateTime: Date;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { bookings } = await import("../drizzle/schema");
  // Create booking without userId (public booking)
  const result = await db.insert(bookings).values({
    serviceId: data.serviceId,
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    phone: data.customerPhone,
    address: data.address,
    dateTime: data.dateTime,
    notes: data.notes,
    status: "pending",
  });
  // Return the created booking with ID
  const insertId = result[0].insertId;
  return { id: insertId, ...data };
}

export async function updateBooking(id: number, data: Partial<{
  customerName: string;
  address: string;
  phone: string;
  dateTime: Date;
  serviceId: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes: string;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { bookings } = await import("../drizzle/schema");
  await db.update(bookings).set(data).where(eq(bookings.id, id));
}

export async function deleteBooking(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { bookings } = await import("../drizzle/schema");
  await db.delete(bookings).where(eq(bookings.id, id));
}

// User profile update
export async function updateUserProfile(userId: number, data: {
  name?: string;
  email?: string;
  phone?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.phone !== undefined) updateData.phone = data.phone;
  
  if (Object.keys(updateData).length === 0) {
    throw new Error("No fields to update");
  }
  
  await db.update(users).set(updateData).where(eq(users.id, userId));
  
  // Return updated user
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0];
}

// Get upcoming bookings for dropdown preview
export async function getUpcomingBookings(userId: number, limit: number = 3) {
  const db = await getDb();
  if (!db) return [];
  const { bookings, services } = await import("../drizzle/schema");
  const { gte, and, or, desc } = await import("drizzle-orm");
  
  const now = new Date();
  
  return db.select({
    id: bookings.id,
    customerName: bookings.customerName,
    dateTime: bookings.dateTime,
    status: bookings.status,
    serviceId: bookings.serviceId,
    serviceName: services.name,
    serviceNameEn: services.nameEn,
  }).from(bookings)
    .leftJoin(services, eq(bookings.serviceId, services.id))
    .where(
      and(
        eq(bookings.userId, userId),
        or(
          gte(bookings.dateTime, now),
          eq(bookings.status, "pending"),
          eq(bookings.status, "confirmed")
        )
      )
    )
    .orderBy(bookings.dateTime)
    .limit(limit);
}

// Email verification functions
export async function generateVerificationToken(userId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Generate a random token
  const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
  
  await db.update(users).set({ verificationToken: token }).where(eq(users.id, userId));
  
  return token;
}

export async function verifyEmailToken(token: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db.select().from(users).where(eq(users.verificationToken, token)).limit(1);
  
  if (result.length === 0) return false;
  
  const user = result[0];
  
  // Mark email as verified and clear token
  await db.update(users).set({
    emailVerified: new Date(),
    verificationToken: null,
  }).where(eq(users.id, user.id));
  
  return true;
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0];
}
