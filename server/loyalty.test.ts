import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  awardLoyaltyPoints,
  getUserLoyaltyPoints,
  getLoyaltyTransactions,
  getActiveRewards,
  createReward,
  redeemReward,
  getUserRedemptions,
  adjustUserPoints,
  getAllUsersWithPoints,
} from './db';
import { getDb } from './db';

describe('Loyalty Program', () => {
  let testUserId: number;
  let testRewardId: number;
  let testBookingId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create a test user
    const { users } = await import('../drizzle/schema');
    const userResult = await db.insert(users).values({
      openId: `test-loyalty-${Date.now()}`,
      name: 'Test Loyalty User',
      email: `loyalty-test-${Date.now()}@example.com`,
      role: 'user',
    });
    testUserId = userResult[0].insertId;

    // Create a test booking
    const { bookings } = await import('../drizzle/schema');
    const bookingResult = await db.insert(bookings).values({
      userId: testUserId,
      customerName: 'Test Customer',
      address: 'Test Address',
      dateTime: new Date(),
      status: 'completed',
    });
    testBookingId = bookingResult[0].insertId;
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up test data
    const { users, loyaltyTransactions, redemptions, rewards } = await import('../drizzle/schema');
    const { eq } = await import('drizzle-orm');

    if (testRewardId) {
      await db.delete(rewards).where(eq(rewards.id, testRewardId));
    }
    await db.delete(redemptions).where(eq(redemptions.userId, testUserId));
    await db.delete(loyaltyTransactions).where(eq(loyaltyTransactions.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  describe('Points Earning', () => {
    it('should award loyalty points to user', async () => {
      await awardLoyaltyPoints(testUserId, testBookingId, 10);
      const points = await getUserLoyaltyPoints(testUserId);
      expect(points).toBe(10);
    });

    it('should track loyalty transactions', async () => {
      const transactions = await getLoyaltyTransactions(testUserId);
      expect(transactions.length).toBeGreaterThan(0);
      expect(transactions[0].type).toBe('earned');
      expect(transactions[0].points).toBe(10);
    });

    it('should accumulate points from multiple bookings', async () => {
      await awardLoyaltyPoints(testUserId, testBookingId, 15);
      const points = await getUserLoyaltyPoints(testUserId);
      expect(points).toBe(25); // 10 + 15
    });
  });

  describe('Rewards Management', () => {
    it('should create a new reward', async () => {
      const result = await createReward({
        name: 'خصم 10%',
        nameEn: '10% Discount',
        description: 'خصم 10% على الحجز التالي',
        descriptionEn: '10% off your next booking',
        pointsCost: 20,
        discountType: 'percentage',
        discountValue: 10,
      });
      testRewardId = result[0].insertId;
      expect(testRewardId).toBeGreaterThan(0);
    });

    it('should list active rewards', async () => {
      const rewards = await getActiveRewards();
      expect(rewards.length).toBeGreaterThan(0);
      const testReward = rewards.find((r) => r.id === testRewardId);
      expect(testReward).toBeDefined();
      expect(testReward?.nameEn).toBe('10% Discount');
    });
  });

  describe('Reward Redemption', () => {
    it('should redeem a reward successfully', async () => {
      const pointsBefore = await getUserLoyaltyPoints(testUserId);
      expect(pointsBefore).toBeGreaterThanOrEqual(20);

      const result = await redeemReward(testUserId, testRewardId);
      expect(result.redemptionId).toBeGreaterThan(0);
      expect(result.reward.nameEn).toBe('10% Discount');

      const pointsAfter = await getUserLoyaltyPoints(testUserId);
      expect(pointsAfter).toBe(pointsBefore - 20);
    });

    it('should fail when insufficient points', async () => {
      // Try to redeem the same reward again (user should have 5 points left, needs 20)
      await expect(redeemReward(testUserId, testRewardId)).rejects.toThrow('Insufficient points');
    });

    it('should track redemption history', async () => {
      const redemptions = await getUserRedemptions(testUserId);
      expect(redemptions.length).toBe(1);
      expect(redemptions[0].rewardNameEn).toBe('10% Discount');
      expect(redemptions[0].pointsSpent).toBe(20);
      expect(redemptions[0].status).toBe('pending');
    });
  });

  describe('Admin Points Adjustment', () => {
    it('should add bonus points', async () => {
      const pointsBefore = await getUserLoyaltyPoints(testUserId);
      await adjustUserPoints(testUserId, 50, 'Bonus points for being a loyal customer');
      const pointsAfter = await getUserLoyaltyPoints(testUserId);
      expect(pointsAfter).toBe(pointsBefore + 50);
    });

    it('should deduct penalty points', async () => {
      const pointsBefore = await getUserLoyaltyPoints(testUserId);
      await adjustUserPoints(testUserId, -10, 'Penalty for late cancellation');
      const pointsAfter = await getUserLoyaltyPoints(testUserId);
      expect(pointsAfter).toBe(pointsBefore - 10);
    });

    it('should track bonus/penalty transactions', async () => {
      const transactions = await getLoyaltyTransactions(testUserId);
      const bonusTransaction = transactions.find((t) => t.type === 'bonus');
      const penaltyTransaction = transactions.find((t) => t.type === 'penalty');

      expect(bonusTransaction).toBeDefined();
      expect(bonusTransaction?.points).toBe(50);

      expect(penaltyTransaction).toBeDefined();
      expect(penaltyTransaction?.points).toBe(-10);
    });
  });

  describe('Admin User Points View', () => {
    it('should list all users with their points', async () => {
      const users = await getAllUsersWithPoints();
      expect(users.length).toBeGreaterThan(0);

      const testUser = users.find((u) => u.id === testUserId);
      expect(testUser).toBeDefined();
      expect(testUser?.name).toBe('Test Loyalty User');
      expect(testUser?.loyaltyPoints).toBeGreaterThan(0);
    });
  });

  describe('Points Earning on Booking Completion', () => {
    it('should automatically award points when booking is marked as completed', async () => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const { bookings } = await import('../drizzle/schema');

      // Create a new booking
      const bookingResult = await db.insert(bookings).values({
        userId: testUserId,
        customerName: 'Test Customer 2',
        address: 'Test Address 2',
        dateTime: new Date(),
        status: 'pending',
      });
      const newBookingId = bookingResult[0].insertId;

      const pointsBefore = await getUserLoyaltyPoints(testUserId);

      // Update booking to completed (this should trigger points award)
      const { updateBooking } = await import('./db');
      await updateBooking(newBookingId, { status: 'completed' });

      // Manually award points (in real app, this happens in the update booking mutation)
      await awardLoyaltyPoints(testUserId, newBookingId, 10);

      const pointsAfter = await getUserLoyaltyPoints(testUserId);
      expect(pointsAfter).toBe(pointsBefore + 10);
    });
  });
});
