import { boolean, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
  price: int("price").notNull().default(0), // Base price in cents (for backward compatibility)
  pricingType: mysqlEnum("pricingType", ["BEDROOM_BASED", "SQM_BASED", "ITEM_BASED", "FIXED"]).default("FIXED").notNull(),
  galleryImages: json("galleryImages").$type<string[]>(), // Array of image URLs for photo gallery
  checklist: json("checklist").$type<Array<{ text: string; textEn?: string }>>(), // Service checklist items
  isVisible: boolean("isVisible").default(true).notNull(), // Visibility toggle for hiding test/inactive services
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
  // Payment fields
  paymentId: varchar("paymentId", { length: 255 }), // Paymob transaction ID
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "success", "failed"]).default("pending"),
  amount: int("amount"), // Amount in cents
  pricingBreakdown: json("pricingBreakdown"), // Detailed pricing breakdown (selections, add-ons, discounts)
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

/**
 * Pricing tiers table for bedroom-based pricing (Service Apartments, Periodical Cleaning)
 */
export const pricingTiers = mysqlTable("pricingTiers", {
  id: int("id").autoincrement().primaryKey(),
  serviceId: int("serviceId").references(() => services.id, { onDelete: "cascade" }).notNull(),
  bedrooms: int("bedrooms").notNull(), // 1, 2, 3, 4, 5, 6
  price: int("price").notNull(), // Price in cents
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PricingTier = typeof pricingTiers.$inferSelect;
export type InsertPricingTier = typeof pricingTiers.$inferInsert;

/**
 * Square meter pricing table (Deep Cleaning, Move-In/Move-Out)
 */
export const pricingSqm = mysqlTable("pricingSqm", {
  id: int("id").autoincrement().primaryKey(),
  serviceId: int("serviceId").references(() => services.id, { onDelete: "cascade" }).notNull(),
  pricePerSqm: int("pricePerSqm").notNull(), // Price per square meter in cents
  minimumCharge: int("minimumCharge"), // Minimum order amount in cents
  tier: varchar("tier", { length: 50 }), // "normal" or "heavy" for Move-In/Move-Out
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PricingSqm = typeof pricingSqm.$inferSelect;
export type InsertPricingSqm = typeof pricingSqm.$inferInsert;

/**
 * Item-based pricing table (Upholstery Cleaning)
 */
export const pricingItems = mysqlTable("pricingItems", {
  id: int("id").autoincrement().primaryKey(),
  serviceId: int("serviceId").references(() => services.id, { onDelete: "cascade" }).notNull(),
  itemName: varchar("itemName", { length: 100 }).notNull(), // Arabic name
  itemNameEn: varchar("itemNameEn", { length: 100 }).notNull(), // English name
  price: int("price").notNull(), // Price per item in cents
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PricingItem = typeof pricingItems.$inferSelect;
export type InsertPricingItem = typeof pricingItems.$inferInsert;

/**
 * Add-ons table (Laundry, Garden/Terrace, Kitchen Deep Clean, etc.)
 */
export const addOns = mysqlTable("addOns", {
  id: int("id").autoincrement().primaryKey(),
  serviceId: int("serviceId").references(() => services.id, { onDelete: "cascade" }), // Nullable for global add-ons
  name: varchar("name", { length: 255 }).notNull(), // Arabic name
  nameEn: varchar("nameEn", { length: 255 }).notNull(), // English name
  description: text("description"), // Arabic description
  descriptionEn: text("descriptionEn"), // English description
  price: int("price").notNull(), // Base price in cents
  pricingType: mysqlEnum("pricingType", ["FIXED", "PER_BEDROOM", "SIZE_TIERED"]).default("FIXED").notNull(),
  sizeTierThreshold: int("sizeTierThreshold"), // Size threshold in sqm (e.g., 100 for garden)
  sizeTierMultiplier: int("sizeTierMultiplier"), // Multiplier in percentage (e.g., 150 for +50%)
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AddOn = typeof addOns.$inferSelect;
export type InsertAddOn = typeof addOns.$inferInsert;

/**
 * Add-on pricing tiers for bedroom-based add-ons (e.g., Laundry, Garden)
 */
export const addOnTiers = mysqlTable("addOnTiers", {
  id: int("id").autoincrement().primaryKey(),
  addOnId: int("addOnId").references(() => addOns.id, { onDelete: "cascade" }).notNull(),
  bedrooms: int("bedrooms").notNull(), // 1, 2, 3, 4, 5, 6
  price: int("price").notNull(), // Price in cents
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AddOnTier = typeof addOnTiers.$inferSelect;
export type InsertAddOnTier = typeof addOnTiers.$inferInsert;

/**
 * Package discounts table (for Periodical Cleaning)
 */
export const packageDiscounts = mysqlTable("packageDiscounts", {
  id: int("id").autoincrement().primaryKey(),
  serviceId: int("serviceId").references(() => services.id, { onDelete: "cascade" }).notNull(),
  visits: int("visits").notNull(), // Number of visits (4, 6, 8, 12)
  discountPercentage: int("discountPercentage").notNull(), // Discount percentage (10, 12, 15, 20)
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PackageDiscount = typeof packageDiscounts.$inferSelect;
export type InsertPackageDiscount = typeof packageDiscounts.$inferInsert;

/**
 * Special offers table (Referral, Property Manager, Emergency Same-Day)
 */
export const specialOffers = mysqlTable("specialOffers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // Arabic name
  nameEn: varchar("nameEn", { length: 255 }).notNull(), // English name
  description: text("description"), // Arabic description
  descriptionEn: text("descriptionEn"), // English description
  offerType: mysqlEnum("offerType", ["REFERRAL", "PROPERTY_MANAGER", "EMERGENCY_SAME_DAY"]).notNull(),
  discountType: mysqlEnum("discountType", ["percentage", "fixed"]).notNull(),
  discountValue: int("discountValue").notNull(), // Percentage or fixed amount in cents
  minProperties: int("minProperties"), // For property manager (5-10, 11+)
  maxDiscount: int("maxDiscount"), // Max discount amount in cents (e.g., 500 EGP for referral)
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SpecialOffer = typeof specialOffers.$inferSelect;
export type InsertSpecialOffer = typeof specialOffers.$inferInsert;
/**
 * Quotes table - Save and share booking selections
 */
export const quotes = mysqlTable("quotes", {
  id: int("id").autoincrement().primaryKey(),
  quoteCode: varchar("quoteCode", { length: 12 }).notNull().unique(), // Unique shareable code (e.g., "Q7X9K2M4P1L5")
  serviceId: int("serviceId").notNull().references(() => services.id),
  
  // Booking selections stored as JSON
  selections: json("selections").notNull().$type<{
    // Service-specific pricing
    bedrooms?: number; // For bedroom-based services
    squareMeters?: number; // For sqm-based services
    selectedItems?: Array<{ itemId: number; quantity: number }>; // For item-based services
    
    // Add-ons
    addOns?: Array<{ addOnId: number; quantity?: number }>;
    
    // Discounts
    packageDiscountId?: number;
    specialOfferId?: number;
    
    // Booking details
    date?: string;
    time?: string;
    address?: string;
    notes?: string;
  }>(),
  
  totalPrice: int("totalPrice").notNull(), // Total price in cents
  
  // Optional user association
  userId: int("userId").references(() => users.id),
  customerName: varchar("customerName", { length: 255 }),
  customerEmail: varchar("customerEmail", { length: 255 }),
  customerPhone: varchar("customerPhone", { length: 50 }),
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(), // Quote expires after 30 days
  viewCount: int("viewCount").default(0).notNull(), // Track how many times quote was viewed
  convertedToBooking: boolean("convertedToBooking").default(false).notNull(),
});

export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = typeof quotes.$inferInsert;

/**
 * Favorite services table - Track user's favorite services for quick rebooking
 */
export const favoriteServices = mysqlTable("favoriteServices", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id, { onDelete: "cascade" }).notNull(),
  serviceId: int("serviceId").references(() => services.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FavoriteService = typeof favoriteServices.$inferSelect;
export type InsertFavoriteService = typeof favoriteServices.$inferInsert;

/**
 * Referrals table - Track referral codes and conversions
 */
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  referrerId: int("referrerId").references(() => users.id, { onDelete: "cascade" }).notNull(), // User who owns the referral code
  referralCode: varchar("referralCode", { length: 8 }).notNull().unique(), // Unique 8-character code (e.g., "BOB12345")
  referredUserId: int("referredUserId").references(() => users.id, { onDelete: "set null" }), // User who used the code (null until used)
  bookingId: int("bookingId").references(() => bookings.id, { onDelete: "set null" }), // Booking where code was used
  status: mysqlEnum("status", ["pending", "completed", "expired"]).default("pending").notNull(),
  discountAmount: int("discountAmount"), // Discount given in cents (e.g., 50000 for 500 EGP)
  rewardAmount: int("rewardAmount"), // Reward given to referrer in cents
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  usedAt: timestamp("usedAt"), // When the code was used
  completedAt: timestamp("completedAt"), // When the referred booking was completed
});

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

/**
 * Push Subscriptions table for web push notifications
 */
export const pushSubscriptions = mysqlTable("pushSubscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(), // Public key for encryption
  auth: text("auth").notNull(), // Authentication secret
  userAgent: text("userAgent"), // Device/browser info
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;
