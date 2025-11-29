import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  emailVerified: timestamp("emailVerified"),
  verificationToken: varchar("verificationToken", { length: 255 }),
  emailNotifications: boolean("emailNotifications").default(true).notNull(),
  whatsappNotifications: boolean("whatsappNotifications").default(true).notNull(),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  loyaltyPoints: int("loyaltyPoints").default(0).notNull(), // Total loyalty points balance
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Services table for managing cleaning service types
 */
export const services = mysqlTable("services", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // Arabic name
  nameEn: varchar("nameEn", { length: 255 }), // English name
  description: text("description"), // Arabic description
  descriptionEn: text("descriptionEn"), // English description
  duration: int("duration"), // Duration in minutes
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

/**
 * Bookings table for managing customer appointments
 */
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  userId: int("userId").notNull(),
  serviceId: int("serviceId").notNull(),
  rating: int("rating").notNull(), // 1-5 stars
  reviewText: text("reviewText"),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, approved, rejected
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id, { onDelete: "cascade" }), // Nullable for public bookings
  serviceId: int("serviceId").references(() => services.id, { onDelete: "set null" }),
  customerName: varchar("customerName", { length: 100 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }), // Optional email for public bookings
  address: varchar("address", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  dateTime: timestamp("dateTime").notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "completed", "cancelled"]).default("pending").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

/**
 * Rewards table for managing loyalty program rewards
 */
export const rewards = mysqlTable("rewards", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // Arabic name
  nameEn: varchar("nameEn", { length: 255 }).notNull(), // English name
  description: text("description"), // Arabic description
  descriptionEn: text("descriptionEn"), // English description
  pointsCost: int("pointsCost").notNull(), // Points required to redeem
  discountType: mysqlEnum("discountType", ["percentage", "fixed", "free_service"]).notNull(),
  discountValue: int("discountValue"), // Percentage (e.g., 10 for 10%) or fixed amount
  serviceId: int("serviceId").references(() => services.id, { onDelete: "set null" }), // For free_service type
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Reward = typeof rewards.$inferSelect;
export type InsertReward = typeof rewards.$inferInsert;

/**
 * Loyalty points transactions table for tracking point earning and spending
 */
export const loyaltyTransactions = mysqlTable("loyaltyTransactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  points: int("points").notNull(), // Positive for earning, negative for spending
  type: mysqlEnum("type", ["earned", "redeemed", "bonus", "penalty"]).notNull(),
  bookingId: int("bookingId").references(() => bookings.id, { onDelete: "set null" }), // For earned points
  rewardId: int("rewardId").references(() => rewards.id, { onDelete: "set null" }), // For redeemed points
  description: text("description"), // e.g., "Earned from booking #123", "Redeemed 10% discount"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LoyaltyTransaction = typeof loyaltyTransactions.$inferSelect;
export type InsertLoyaltyTransaction = typeof loyaltyTransactions.$inferInsert;

/**
 * Redemptions table for tracking reward usage
 */
export const redemptions = mysqlTable("redemptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  rewardId: int("rewardId").references(() => rewards.id, { onDelete: "set null" }),
  bookingId: int("bookingId").references(() => bookings.id, { onDelete: "set null" }), // Booking where reward was applied
  pointsSpent: int("pointsSpent").notNull(),
  status: mysqlEnum("status", ["pending", "applied", "cancelled"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Redemption = typeof redemptions.$inferSelect;
export type InsertRedemption = typeof redemptions.$inferInsert;