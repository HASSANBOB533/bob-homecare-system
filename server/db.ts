import { desc, eq, sql, and, or, isNull } from "drizzle-orm";
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

export async function updateServiceGallery(serviceId: number, galleryImages: string[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { services } = await import("../drizzle/schema");
  
  await db.update(services)
    .set({ galleryImages })
    .where(eq(services.id, serviceId));
  
  return { success: true };
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
  const results = await db.select({
    id: bookings.id,
    customerName: bookings.customerName,
    address: bookings.address,
    phone: bookings.phone,
    dateTime: bookings.dateTime,
    status: bookings.status,
    notes: bookings.notes,
    serviceId: bookings.serviceId,
    amount: bookings.amount,
    pricingBreakdown: bookings.pricingBreakdown,
    createdAt: bookings.createdAt,
    service: {
      id: services.id,
      name: services.name,
      nameEn: services.nameEn,
    },
  }).from(bookings).leftJoin(services, eq(bookings.serviceId, services.id)).where(eq(bookings.userId, userId));
  
  return results.map(row => ({
    ...row,
    pricingBreakdown: typeof row.pricingBreakdown === 'string' 
      ? JSON.parse(row.pricingBreakdown) 
      : row.pricingBreakdown,
  }));
}

export async function getAllBookings() {
  const db = await getDb();
  if (!db) return [];
  const { bookings, services, users } = await import("../drizzle/schema");
  const results = await db.select({
    id: bookings.id,
    customerName: bookings.customerName,
    address: bookings.address,
    phone: bookings.phone,
    dateTime: bookings.dateTime,
    status: bookings.status,
    notes: bookings.notes,
    serviceId: bookings.serviceId,
    amount: bookings.amount,
    pricingBreakdownRaw: bookings.pricingBreakdown,
    serviceName: services.name,
    serviceNameEn: services.nameEn,
    serviceDescription: services.description,
    serviceDescriptionEn: services.descriptionEn,
    userName: users.name,
    userEmail: users.email,
    createdAt: bookings.createdAt,
  }).from(bookings)
    .leftJoin(services, eq(bookings.serviceId, services.id))
    .leftJoin(users, eq(bookings.userId, users.id));
  
  // Parse pricing breakdown JSON and format service object
  return results.map((booking: any) => ({
    ...booking,
    pricingBreakdown: booking.pricingBreakdownRaw ? 
      (typeof booking.pricingBreakdownRaw === 'string' ? JSON.parse(booking.pricingBreakdownRaw) : booking.pricingBreakdownRaw) 
      : null,
    service: booking.serviceId ? {
      id: booking.serviceId,
      name: booking.serviceName,
      nameEn: booking.serviceNameEn,
      description: booking.serviceDescription,
      descriptionEn: booking.serviceDescriptionEn,
    } : null,
  }));
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
  amount?: number;
  pricingBreakdown?: any;
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
    amount: data.amount,
    pricingBreakdown: data.pricingBreakdown,
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
  
  // Deduplicate add-ons by nameEn (in case same add-on exists for multiple services)
  const uniqueAddOns = addOnsList.reduce((acc, addOn) => {
    if (!acc.find(a => a.nameEn === addOn.nameEn)) {
      acc.push(addOn);
    }
    return acc;
  }, [] as typeof addOnsList);
  
  // Get tiers for each add-on
  const addOnsWithTiers = await Promise.all(
    uniqueAddOns.map(async (addOn) => {
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
 * Get add-ons for a specific service with their tiers
 */
export async function getAddOnsByService(serviceId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { addOns, addOnTiers } = await import("../drizzle/schema");
  
  // Get add-ons that are either linked to this service or are global (serviceId = null)
  const addOnsList = await db.select().from(addOns)
    .where(
      and(
        eq(addOns.active, true),
        or(
          eq(addOns.serviceId, serviceId),
          isNull(addOns.serviceId)
        )
      )
    );
  
  // Deduplicate add-ons by nameEn (in case same add-on exists for multiple services)
  const uniqueAddOns = addOnsList.reduce((acc, addOn) => {
    if (!acc.find(a => a.nameEn === addOn.nameEn)) {
      acc.push(addOn);
    }
    return acc;
  }, [] as typeof addOnsList);
  
  // Get tiers for each add-on
  const addOnsWithTiers = await Promise.all(
    uniqueAddOns.map(async (addOn) => {
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
  
  const offers = await db.select().from(specialOffers)
    .where(eq(specialOffers.active, true))
    .orderBy(specialOffers.name);
  
  // Deduplicate by name (in case same offer exists multiple times)
  const uniqueOffers = offers.reduce((acc, offer) => {
    if (!acc.find(o => o.name === offer.name)) {
      acc.push(offer);
    }
    return acc;
  }, [] as typeof offers);
  
  return uniqueOffers;
}

// ===== PRICING CRUD HELPERS =====

/**
 * Bedroom Tier CRUD
 */
export async function createBedroomTier(data: { 
  serviceId: number; 
  bedrooms: number; 
  price: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { pricingTiers } = await import("../drizzle/schema");
  
  await db.insert(pricingTiers).values(data);
  
  // Fetch the created tier
  const [tier] = await db.select().from(pricingTiers)
    .where(eq(pricingTiers.serviceId, data.serviceId))
    .orderBy(desc(pricingTiers.id))
    .limit(1);
  return tier;
}

export async function updateBedroomTier(id: number, data: { 
  bedrooms?: number; 
  price?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { pricingTiers } = await import("../drizzle/schema");
  
  await db.update(pricingTiers)
    .set(data)
    .where(eq(pricingTiers.id, id));
  
  // Fetch the updated tier
  const [tier] = await db.select().from(pricingTiers).where(eq(pricingTiers.id, id));
  return tier;
}

export async function deleteBedroomTier(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { pricingTiers } = await import("../drizzle/schema");
  
  await db.delete(pricingTiers).where(eq(pricingTiers.id, id));
  return { success: true };
}

/**
 * Square Meter Pricing CRUD
 */
export async function createSqmPricing(data: { 
  serviceId: number; 
  variant?: string; 
  pricePerSqm: number;
  minimumCharge: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { pricingSqm } = await import("../drizzle/schema");
  
  await db.insert(pricingSqm).values(data);
  
  // Fetch the created pricing
  const [pricing] = await db.select().from(pricingSqm)
    .where(eq(pricingSqm.serviceId, data.serviceId))
    .orderBy(desc(pricingSqm.id))
    .limit(1);
  return pricing;
}

export async function updateSqmPricing(id: number, data: { 
  variant?: string; 
  pricePerSqm?: number;
  minimumCharge?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { pricingSqm } = await import("../drizzle/schema");
  
  await db.update(pricingSqm)
    .set(data)
    .where(eq(pricingSqm.id, id));
  
  // Fetch the updated pricing
  const [pricing] = await db.select().from(pricingSqm).where(eq(pricingSqm.id, id));
  return pricing;
}

export async function deleteSqmPricing(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { pricingSqm } = await import("../drizzle/schema");
  
  await db.delete(pricingSqm).where(eq(pricingSqm.id, id));
  return { success: true };
}

/**
 * Upholstery Item CRUD
 */
export async function createUpholsteryItem(data: { 
  serviceId: number; 
  itemName: string; 
  itemNameEn: string; 
  price: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { pricingItems } = await import("../drizzle/schema");
  
  await db.insert(pricingItems).values(data);
  
  // Fetch the created item
  const [item] = await db.select().from(pricingItems)
    .where(eq(pricingItems.serviceId, data.serviceId))
    .orderBy(desc(pricingItems.id))
    .limit(1);
  return item;
}

export async function updateUpholsteryItem(id: number, data: { 
  itemName?: string; 
  itemNameEn?: string; 
  price?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { pricingItems } = await import("../drizzle/schema");
  
  await db.update(pricingItems)
    .set(data)
    .where(eq(pricingItems.id, id));
  
  // Fetch the updated item
  const [item] = await db.select().from(pricingItems).where(eq(pricingItems.id, id));
  return item;
}

export async function deleteUpholsteryItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { pricingItems } = await import("../drizzle/schema");
  
  await db.delete(pricingItems).where(eq(pricingItems.id, id));
  return { success: true };
}

/**
 * Add-On CRUD
 */
export async function createAddOn(data: { 
  serviceId?: number;
  name: string; 
  nameEn: string; 
  description?: string;
  descriptionEn?: string;
  price: number;
  pricingType?: "FIXED" | "PER_BEDROOM" | "SIZE_TIERED";
  sizeTierThreshold?: number;
  sizeTierMultiplier?: number;
  active?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { addOns } = await import("../drizzle/schema");
  
  await db.insert(addOns).values({
    serviceId: data.serviceId,
    name: data.name,
    nameEn: data.nameEn,
    description: data.description,
    descriptionEn: data.descriptionEn,
    price: data.price,
    pricingType: data.pricingType || "FIXED",
    sizeTierThreshold: data.sizeTierThreshold,
    sizeTierMultiplier: data.sizeTierMultiplier,
    active: data.active ?? true,
  });
  
  // Fetch the created add-on
  const [addOn] = await db.select().from(addOns)
    .orderBy(desc(addOns.id))
    .limit(1);
  return addOn;
}

export async function updateAddOn(id: number, data: { 
  serviceId?: number;
  name?: string; 
  nameEn?: string; 
  description?: string;
  descriptionEn?: string;
  price?: number;
  pricingType?: "FIXED" | "PER_BEDROOM" | "SIZE_TIERED";
  sizeTierThreshold?: number;
  sizeTierMultiplier?: number;
  active?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { addOns } = await import("../drizzle/schema");
  
  const updateData: any = {};
  if (data.serviceId !== undefined) updateData.serviceId = data.serviceId;
  if (data.name !== undefined) updateData.name = data.name;
  if (data.nameEn !== undefined) updateData.nameEn = data.nameEn;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.descriptionEn !== undefined) updateData.descriptionEn = data.descriptionEn;
  if (data.price !== undefined) updateData.price = data.price;
  if (data.pricingType !== undefined) updateData.pricingType = data.pricingType;
  if (data.sizeTierThreshold !== undefined) updateData.sizeTierThreshold = data.sizeTierThreshold;
  if (data.sizeTierMultiplier !== undefined) updateData.sizeTierMultiplier = data.sizeTierMultiplier;
  if (data.active !== undefined) updateData.active = data.active;
  
  await db.update(addOns)
    .set(updateData)
    .where(eq(addOns.id, id));
  
  // Fetch the updated add-on
  const [addOn] = await db.select().from(addOns).where(eq(addOns.id, id));
  return addOn;
}

export async function deleteAddOn(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { addOns } = await import("../drizzle/schema");
  
  await db.delete(addOns).where(eq(addOns.id, id));
  return { success: true };
}

/**
 * Add-On Tier CRUD
 */
export async function createAddOnTier(data: { 
  addOnId: number; 
  bedrooms: number; 
  price: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { addOnTiers } = await import("../drizzle/schema");
  
  await db.insert(addOnTiers).values(data);
  
  // Fetch the created tier
  const [tier] = await db.select().from(addOnTiers)
    .where(eq(addOnTiers.addOnId, data.addOnId))
    .orderBy(desc(addOnTiers.id))
    .limit(1);
  return tier;
}

export async function updateAddOnTier(id: number, data: { 
  bedrooms?: number; 
  price?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { addOnTiers } = await import("../drizzle/schema");
  
  await db.update(addOnTiers)
    .set(data)
    .where(eq(addOnTiers.id, id));
  
  // Fetch the updated tier
  const [tier] = await db.select().from(addOnTiers).where(eq(addOnTiers.id, id));
  return tier;
}

export async function deleteAddOnTier(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { addOnTiers } = await import("../drizzle/schema");
  
  await db.delete(addOnTiers).where(eq(addOnTiers.id, id));
  return { success: true };
}

/**
 * Package Discount CRUD
 */
export async function createPackageDiscount(data: { 
  serviceId: number; 
  visits: number; 
  discountPercentage: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { packageDiscounts } = await import("../drizzle/schema");
  
  await db.insert(packageDiscounts).values(data);
  
  // Fetch the created discount
  const [discount] = await db.select().from(packageDiscounts)
    .where(eq(packageDiscounts.serviceId, data.serviceId))
    .orderBy(desc(packageDiscounts.id))
    .limit(1);
  return discount;
}

export async function updatePackageDiscount(id: number, data: { 
  visits?: number; 
  discountPercentage?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { packageDiscounts } = await import("../drizzle/schema");
  
  await db.update(packageDiscounts)
    .set(data)
    .where(eq(packageDiscounts.id, id));
  
  // Fetch the updated discount
  const [discount] = await db.select().from(packageDiscounts).where(eq(packageDiscounts.id, id));
  return discount;
}

export async function deletePackageDiscount(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { packageDiscounts } = await import("../drizzle/schema");
  
  await db.delete(packageDiscounts).where(eq(packageDiscounts.id, id));
  return { success: true };
}

/**
 * Special Offer CRUD
 */
export async function createSpecialOffer(data: { 
  name: string; 
  nameEn: string; 
  description?: string;
  descriptionEn?: string;
  offerType: "REFERRAL" | "PROPERTY_MANAGER" | "EMERGENCY_SAME_DAY";
  discountType: "percentage" | "fixed";
  discountValue: number;
  minProperties?: number;
  maxDiscount?: number;
  active?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { specialOffers } = await import("../drizzle/schema");
  
  const [offer] = await db.insert(specialOffers).values({
    name: data.name,
    nameEn: data.nameEn,
    description: data.description,
    descriptionEn: data.descriptionEn,
    offerType: data.offerType,
    discountType: data.discountType,
    discountValue: data.discountValue,
    minProperties: data.minProperties,
    maxDiscount: data.maxDiscount,
    active: data.active ?? true,
  });
  return offer;
}

export async function updateSpecialOffer(id: number, data: { 
  name?: string; 
  nameEn?: string; 
  description?: string;
  descriptionEn?: string;
  offerType?: "REFERRAL" | "PROPERTY_MANAGER" | "EMERGENCY_SAME_DAY";
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  minProperties?: number;
  maxDiscount?: number;
  active?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { specialOffers } = await import("../drizzle/schema");
  
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.nameEn !== undefined) updateData.nameEn = data.nameEn;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.descriptionEn !== undefined) updateData.descriptionEn = data.descriptionEn;
  if (data.offerType !== undefined) updateData.offerType = data.offerType;
  if (data.discountType !== undefined) updateData.discountType = data.discountType;
  if (data.discountValue !== undefined) updateData.discountValue = data.discountValue;
  if (data.minProperties !== undefined) updateData.minProperties = data.minProperties;
  if (data.maxDiscount !== undefined) updateData.maxDiscount = data.maxDiscount;
  if (data.active !== undefined) updateData.active = data.active;
  
  await db.update(specialOffers)
    .set(updateData)
    .where(eq(specialOffers.id, id));
  
  // Fetch and return the updated offer
  const [offer] = await db.select().from(specialOffers).where(eq(specialOffers.id, id));
  return offer;
}

export async function deleteSpecialOffer(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { specialOffers } = await import("../drizzle/schema");
  
  await db.delete(specialOffers).where(eq(specialOffers.id, id));
  return { success: true };
}


// ============================================================================
// Quote Management Functions
// ============================================================================

/**
 * Generate a unique quote code (12 characters, alphanumeric)
 */
function generateQuoteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar characters (I, O, 0, 1)
  let code = 'Q'; // Start with Q for "Quote"
  for (let i = 0; i < 11; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Create a new quote
 */
export async function createQuote(data: {
  serviceId: number;
  selections: any;
  totalPrice: number;
  userId?: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const { quotes } = await import("../drizzle/schema");

  // Generate unique quote code
  let quoteCode = generateQuoteCode();
  let attempts = 0;
  const maxAttempts = 10;

  // Ensure code is unique
  while (attempts < maxAttempts) {
    const existing = await db.select().from(quotes).where(eq(quotes.quoteCode, quoteCode)).limit(1);
    if (existing.length === 0) break;
    quoteCode = generateQuoteCode();
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new Error("Failed to generate unique quote code");
  }

  // Set expiration to 30 days from now
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  // Insert quote
  await db.insert(quotes).values({
    quoteCode,
    serviceId: data.serviceId,
    selections: data.selections,
    totalPrice: data.totalPrice,
    userId: data.userId,
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    customerPhone: data.customerPhone,
    expiresAt,
  });

  // Fetch the created quote
  const [quote] = await db
    .select()
    .from(quotes)
    .where(eq(quotes.quoteCode, quoteCode))
    .limit(1);

  return quote;
}

/**
 * Get quote by code
 */
export async function getQuoteByCode(code: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const { quotes, services } = await import("../drizzle/schema");

  // Increment view count
  await db
    .update(quotes)
    .set({ viewCount: sql`${quotes.viewCount} + 1` })
    .where(eq(quotes.quoteCode, code));

  // Fetch quote with service details
  const [quote] = await db
    .select({
      id: quotes.id,
      quoteCode: quotes.quoteCode,
      serviceId: quotes.serviceId,
      serviceName: services.name,
      serviceNameEn: services.nameEn,
      serviceDuration: services.duration,
      selections: quotes.selections,
      totalPrice: quotes.totalPrice,
      userId: quotes.userId,
      customerName: quotes.customerName,
      customerEmail: quotes.customerEmail,
      customerPhone: quotes.customerPhone,
      createdAt: quotes.createdAt,
      expiresAt: quotes.expiresAt,
      viewCount: quotes.viewCount,
      convertedToBooking: quotes.convertedToBooking,
    })
    .from(quotes)
    .leftJoin(services, eq(quotes.serviceId, services.id))
    .where(eq(quotes.quoteCode, code))
    .limit(1);

  if (!quote) {
    throw new Error("Quote not found");
  }

  // Check if quote has expired
  if (new Date() > new Date(quote.expiresAt)) {
    throw new Error("Quote has expired");
  }

  return quote;
}

/**
 * Update an existing quote
 */
export async function updateQuote(
  id: number,
  data: {
    selections: any;
    totalPrice: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const { quotes } = await import("../drizzle/schema");

  await db
    .update(quotes)
    .set({
      selections: data.selections,
      totalPrice: data.totalPrice,
    })
    .where(eq(quotes.id, id));

  const [updated] = await db.select().from(quotes).where(eq(quotes.id, id)).limit(1);
  return updated;
}

/**
 * Mark quote as converted to booking
 */
export async function markQuoteConverted(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const { quotes } = await import("../drizzle/schema");

  await db
    .update(quotes)
    .set({ convertedToBooking: true })
    .where(eq(quotes.id, id));

  return { success: true };
}

/**
 * Toggle favorite service (add or remove)
 */
export async function toggleFavorite(userId: number, serviceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const { favoriteServices } = await import("../drizzle/schema");

  // Check if already favorited
  const [existing] = await db
    .select()
    .from(favoriteServices)
    .where(and(eq(favoriteServices.userId, userId), eq(favoriteServices.serviceId, serviceId)))
    .limit(1);

  if (existing) {
    // Remove favorite
    await db
      .delete(favoriteServices)
      .where(and(eq(favoriteServices.userId, userId), eq(favoriteServices.serviceId, serviceId)));
    return { isFavorite: false };
  } else {
    // Add favorite
    await db.insert(favoriteServices).values({
      userId,
      serviceId,
    });
    return { isFavorite: true };
  }
}

/**
 * Get user's favorite services with full service details
 */
export async function getUserFavorites(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const { favoriteServices, services } = await import("../drizzle/schema");

  const favorites = await db
    .select({
      id: favoriteServices.id,
      serviceId: favoriteServices.serviceId,
      createdAt: favoriteServices.createdAt,
      service: {
        id: services.id,
        name: services.name,
        nameEn: services.nameEn,
        description: services.description,
        descriptionEn: services.descriptionEn,
        pricingType: services.pricingType,
        price: services.price,
        galleryImages: services.galleryImages,
      },
    })
    .from(favoriteServices)
    .innerJoin(services, eq(favoriteServices.serviceId, services.id))
    .where(eq(favoriteServices.userId, userId))
    .orderBy(desc(favoriteServices.createdAt));

  return favorites;
}

/**
 * Check if a service is favorited by user
 */
export async function isFavoriteService(userId: number, serviceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const { favoriteServices } = await import("../drizzle/schema");

  const [favorite] = await db
    .select()
    .from(favoriteServices)
    .where(and(eq(favoriteServices.userId, userId), eq(favoriteServices.serviceId, serviceId)))
    .limit(1);

  return { isFavorite: !!favorite };
}
