import { desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, reviews, services, users } from "../drizzle/schema";
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
  return { id: result[0].insertId, ...data };
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

export async function updateBookingPayment(id: number, data: {
  paymentId?: string;
  paymentStatus?: "pending" | "success" | "failed";
  amount?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { bookings } = await import("../drizzle/schema");
  await db.update(bookings).set(data).where(eq(bookings.id, id));
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

// Review functions
export async function createReview(data: {
  bookingId: number;
  userId: number;
  serviceId: number;
  rating: number;
  reviewText?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { reviews } = await import("../drizzle/schema");
  
  const result = await db.insert(reviews).values(data);
  return result;
}

export async function getServiceReviews(serviceId: number) {
  const db = await getDb();
  if (!db) return [];
  const { reviews } = await import("../drizzle/schema");
  const { desc } = await import("drizzle-orm");
  
  return db.select({
    id: reviews.id,
    rating: reviews.rating,
    reviewText: reviews.reviewText,
    createdAt: reviews.createdAt,
    userId: reviews.userId,
  }).from(reviews).where(eq(reviews.serviceId, serviceId)).orderBy(desc(reviews.createdAt));
}

export async function getServiceAverageRating(serviceId: number): Promise<{ average: number; count: number }> {
  const db = await getDb();
  if (!db) return { average: 0, count: 0 };
  const { reviews } = await import("../drizzle/schema");
  const { avg, count } = await import("drizzle-orm");
  
  const result = await db.select({
    average: avg(reviews.rating),
    count: count(reviews.id),
  }).from(reviews).where(eq(reviews.serviceId, serviceId));
  
  return {
    average: Number(result[0]?.average || 0),
    count: Number(result[0]?.count || 0),
  };
}

export async function getUserReviewForBooking(userId: number, bookingId: number) {
  const db = await getDb();
  if (!db) return null;
  const { reviews } = await import("../drizzle/schema");
  const { and } = await import("drizzle-orm");
  
  const result = await db.select().from(reviews).where(
    and(
      eq(reviews.userId, userId),
      eq(reviews.bookingId, bookingId)
    )
  ).limit(1);
  
  return result[0] || null;
}


/**
 * Get all reviews submitted by a specific user
 */
export async function getUserReviews(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const userReviews = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      reviewText: reviews.reviewText,
      createdAt: reviews.createdAt,
      serviceName: services.name,
      serviceNameEn: services.nameEn,
    })
    .from(reviews)
    .leftJoin(services, eq(reviews.serviceId, services.id))
    .where(eq(reviews.userId, userId))
    .orderBy(desc(reviews.createdAt));

  return userReviews;
}

/**
 * Get user's review statistics (count and average rating)
 */
export async function getUserReviewStats(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const stats = await db
    .select({
      count: sql<number>`count(*)`,
      avgRating: sql<number>`avg(${reviews.rating})`,
    })
    .from(reviews)
    .where(eq(reviews.userId, userId));

  return stats[0] || { count: 0, avgRating: 0 };
}


/**
 * Update user's notification preferences
 */
export async function updateNotificationPreferences(
  userId: number,
  preferences: { emailNotifications?: boolean; whatsappNotifications?: boolean }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  await db
    .update(users)
    .set({
      ...preferences,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return getUserById(userId);
}


/**
 * Get user by email address
 */
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  
  return result[0] || null;
}


/**
 * Get all reviews for admin (with user and service details)
 */
export async function getAllReviews() {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  const allReviews = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      reviewText: reviews.reviewText,
      status: reviews.status,
      createdAt: reviews.createdAt,
      updatedAt: reviews.updatedAt,
      userName: users.name,
      userEmail: users.email,
      serviceName: services.name,
      serviceNameEn: services.nameEn,
      bookingId: reviews.bookingId,
    })
    .from(reviews)
    .leftJoin(users, eq(reviews.userId, users.id))
    .leftJoin(services, eq(reviews.serviceId, services.id))
    .orderBy(desc(reviews.createdAt));

  return allReviews;
}

/**
 * Update review status (approve/reject)
 */
export async function updateReviewStatus(reviewId: number, status: "pending" | "approved" | "rejected") {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  await db
    .update(reviews)
    .set({ status, updatedAt: new Date() })
    .where(eq(reviews.id, reviewId));

  return { success: true };
}

/**
 * Update review content
 */
export async function updateReviewContent(reviewId: number, data: { rating?: number; reviewText?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  await db
    .update(reviews)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(reviews.id, reviewId));

  return { success: true };
}

/**
 * Delete review
 */
export async function deleteReview(reviewId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  
  await db
    .delete(reviews)
    .where(eq(reviews.id, reviewId));

  return { success: true };
}

// ============================================
// Loyalty Program Functions
// ============================================

/**
 * Award loyalty points to a user for completing a booking
 * Points calculation: 10 points per booking
 */
export async function awardLoyaltyPoints(userId: number, bookingId: number, points: number = 10) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { loyaltyTransactions } = await import("../drizzle/schema");
  
  // Create transaction record
  await db.insert(loyaltyTransactions).values({
    userId,
    points,
    type: "earned",
    bookingId,
    description: `Earned ${points} points from booking #${bookingId}`,
  });
  
  // Update user's total points
  await db.update(users)
    .set({ loyaltyPoints: sql`${users.loyaltyPoints} + ${points}` })
    .where(eq(users.id, userId));
}

/**
 * Get user's loyalty points balance
 */
export async function getUserLoyaltyPoints(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db.select({ loyaltyPoints: users.loyaltyPoints })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  return result[0]?.loyaltyPoints || 0;
}

/**
 * Get user's loyalty transaction history
 */
export async function getLoyaltyTransactions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { loyaltyTransactions, bookings, rewards } = await import("../drizzle/schema");
  
  return db.select({
    id: loyaltyTransactions.id,
    points: loyaltyTransactions.points,
    type: loyaltyTransactions.type,
    description: loyaltyTransactions.description,
    createdAt: loyaltyTransactions.createdAt,
    bookingId: loyaltyTransactions.bookingId,
    rewardId: loyaltyTransactions.rewardId,
    rewardName: rewards.name,
    rewardNameEn: rewards.nameEn,
  })
    .from(loyaltyTransactions)
    .leftJoin(bookings, eq(loyaltyTransactions.bookingId, bookings.id))
    .leftJoin(rewards, eq(loyaltyTransactions.rewardId, rewards.id))
    .where(eq(loyaltyTransactions.userId, userId))
    .orderBy(desc(loyaltyTransactions.createdAt));
}

/**
 * Get all available rewards
 */
export async function getActiveRewards() {
  const db = await getDb();
  if (!db) return [];
  
  const { rewards, services } = await import("../drizzle/schema");
  
  return db.select({
    id: rewards.id,
    name: rewards.name,
    nameEn: rewards.nameEn,
    description: rewards.description,
    descriptionEn: rewards.descriptionEn,
    pointsCost: rewards.pointsCost,
    discountType: rewards.discountType,
    discountValue: rewards.discountValue,
    serviceId: rewards.serviceId,
    serviceName: services.name,
    serviceNameEn: services.nameEn,
    active: rewards.active,
  })
    .from(rewards)
    .leftJoin(services, eq(rewards.serviceId, services.id))
    .where(eq(rewards.active, true))
    .orderBy(rewards.pointsCost);
}

/**
 * Get reward by ID
 */
export async function getRewardById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const { rewards } = await import("../drizzle/schema");
  const result = await db.select().from(rewards).where(eq(rewards.id, id)).limit(1);
  return result[0];
}

/**
 * Redeem a reward
 */
export async function redeemReward(userId: number, rewardId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { rewards, redemptions, loyaltyTransactions } = await import("../drizzle/schema");
  
  // Get reward details
  const reward = await getRewardById(rewardId);
  if (!reward) throw new Error("Reward not found");
  if (!reward.active) throw new Error("Reward is not active");
  
  // Check user has enough points
  const userPoints = await getUserLoyaltyPoints(userId);
  if (userPoints < reward.pointsCost) {
    throw new Error(`Insufficient points. You have ${userPoints} points but need ${reward.pointsCost}`);
  }
  
  // Create redemption record
  const redemptionResult = await db.insert(redemptions).values({
    userId,
    rewardId,
    pointsSpent: reward.pointsCost,
    status: "pending",
  });
  
  // Create transaction record
  await db.insert(loyaltyTransactions).values({
    userId,
    points: -reward.pointsCost,
    type: "redeemed",
    rewardId,
    description: `Redeemed ${reward.nameEn || reward.name}`,
  });
  
  // Deduct points from user
  await db.update(users)
    .set({ loyaltyPoints: sql`${users.loyaltyPoints} - ${reward.pointsCost}` })
    .where(eq(users.id, userId));
  
  return { redemptionId: redemptionResult[0].insertId, reward };
}

/**
 * Get user's redemption history
 */
export async function getUserRedemptions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { redemptions, rewards } = await import("../drizzle/schema");
  
  return db.select({
    id: redemptions.id,
    rewardId: redemptions.rewardId,
    rewardName: rewards.name,
    rewardNameEn: rewards.nameEn,
    pointsSpent: redemptions.pointsSpent,
    status: redemptions.status,
    createdAt: redemptions.createdAt,
  })
    .from(redemptions)
    .leftJoin(rewards, eq(redemptions.rewardId, rewards.id))
    .where(eq(redemptions.userId, userId))
    .orderBy(desc(redemptions.createdAt));
}

/**
 * Create a new reward (admin only)
 */
export async function createReward(data: {
  name: string;
  nameEn: string;
  description?: string;
  descriptionEn?: string;
  pointsCost: number;
  discountType: "percentage" | "fixed" | "free_service";
  discountValue?: number;
  serviceId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { rewards } = await import("../drizzle/schema");
  const result = await db.insert(rewards).values(data);
  return result;
}

/**
 * Update reward (admin only)
 */
export async function updateReward(id: number, data: Partial<{
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  pointsCost: number;
  discountType: "percentage" | "fixed" | "free_service";
  discountValue: number;
  serviceId: number;
  active: boolean;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { rewards } = await import("../drizzle/schema");
  await db.update(rewards).set(data).where(eq(rewards.id, id));
}

/**
 * Delete reward (admin only)
 */
export async function deleteReward(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { rewards } = await import("../drizzle/schema");
  await db.delete(rewards).where(eq(rewards.id, id));
}

/**
 * Get all rewards (admin only)
 */
export async function getAllRewards() {
  const db = await getDb();
  if (!db) return [];
  
  const { rewards, services } = await import("../drizzle/schema");
  
  return db.select({
    id: rewards.id,
    name: rewards.name,
    nameEn: rewards.nameEn,
    description: rewards.description,
    descriptionEn: rewards.descriptionEn,
    pointsCost: rewards.pointsCost,
    discountType: rewards.discountType,
    discountValue: rewards.discountValue,
    serviceId: rewards.serviceId,
    serviceName: services.name,
    serviceNameEn: services.nameEn,
    active: rewards.active,
    createdAt: rewards.createdAt,
  })
    .from(rewards)
    .leftJoin(services, eq(rewards.serviceId, services.id))
    .orderBy(desc(rewards.createdAt));
}

/**
 * Manually adjust user points (admin only)
 */
export async function adjustUserPoints(userId: number, points: number, description: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { loyaltyTransactions } = await import("../drizzle/schema");
  
  // Create transaction record
  await db.insert(loyaltyTransactions).values({
    userId,
    points,
    type: points > 0 ? "bonus" : "penalty",
    description,
  });
  
  // Update user's total points
  await db.update(users)
    .set({ loyaltyPoints: sql`${users.loyaltyPoints} + ${points}` })
    .where(eq(users.id, userId));
}

/**
 * Get all users with their loyalty points (admin only)
 */
export async function getAllUsersWithPoints() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    loyaltyPoints: users.loyaltyPoints,
    role: users.role,
  })
    .from(users)
    .orderBy(desc(users.loyaltyPoints));
}

/**
 * Get comprehensive pricing data for a specific service
 */
export async function getServicePricingData(serviceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { services, pricingTiers, pricingSqm, pricingItems } = await import("../drizzle/schema");
  
  // Get service details
  const service = await db.select().from(services).where(eq(services.id, serviceId)).limit(1);
  if (!service.length) throw new Error("Service not found");
  
  const serviceData = service[0];
  
  // Get pricing based on type
  let pricingData: any = {};
  
  if (serviceData.pricingType === "BEDROOM_BASED") {
    // Get bedroom tiers
    const tiers = await db.select().from(pricingTiers)
      .where(eq(pricingTiers.serviceId, serviceId))
      .orderBy(pricingTiers.bedrooms);
    pricingData.tiers = tiers;
  } else if (serviceData.pricingType === "SQM_BASED") {
    // Get square meter pricing
    const sqmPricing = await db.select().from(pricingSqm)
      .where(eq(pricingSqm.serviceId, serviceId));
    pricingData.sqmPricing = sqmPricing;
  } else if (serviceData.pricingType === "ITEM_BASED") {
    // Get item pricing
    const items = await db.select().from(pricingItems)
      .where(eq(pricingItems.serviceId, serviceId))
      .orderBy(pricingItems.itemName);
    pricingData.items = items;
  }
  
  return {
    service: serviceData,
    pricing: pricingData,
  };
}

/**
 * Get all add-ons with their tiers
 */
export async function getAllAddOns() {
  const db = await getDb();
  if (!db) return [];
  
  const { addOns, addOnTiers } = await import("../drizzle/schema");
  
  const addOnsList = await db.select().from(addOns).where(eq(addOns.active, true));
  
  // Get tiers for each add-on
  const addOnsWithTiers = await Promise.all(
    addOnsList.map(async (addOn) => {
      const tiers = await db.select().from(addOnTiers)
        .where(eq(addOnTiers.addOnId, addOn.id))
        .orderBy(addOnTiers.bedrooms);
      
      return {
        ...addOn,
        tiers,
      };
    })
  );
  
  return addOnsWithTiers;
}

/**
 * Get package discounts for a specific service
 */
export async function getPackageDiscountsByService(serviceId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { packageDiscounts } = await import("../drizzle/schema");
  
  return db.select().from(packageDiscounts)
    .where(eq(packageDiscounts.serviceId, serviceId))
    .orderBy(packageDiscounts.visits);
}

/**
 * Get all active special offers
 */
export async function getAllSpecialOffers() {
  const db = await getDb();
  if (!db) return [];
  
  const { specialOffers } = await import("../drizzle/schema");
  
  return db.select().from(specialOffers)
    .where(eq(specialOffers.active, true))
    .orderBy(specialOffers.name);
}
