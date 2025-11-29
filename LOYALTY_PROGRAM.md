# Loyalty Program Documentation

## Overview

The BOB Home Care Loyalty Program rewards repeat customers with points for every completed booking. Customers can redeem these points for exclusive discounts and free services.

---

## How It Works

### For Customers

1. **Earn Points**: Customers automatically earn **10 points** for every completed booking
2. **View Balance**: Check your points balance in the Loyalty Dashboard (accessible from user profile dropdown)
3. **Browse Rewards**: Explore available rewards in the Rewards tab
4. **Redeem Rewards**: Exchange your points for discounts or free services
5. **Track History**: View all points earned and rewards redeemed in your transaction history

### For Administrators

1. **Create Rewards**: Define new rewards with custom point costs and discount types
2. **Manage Rewards**: Edit, activate/deactivate, or delete existing rewards
3. **View User Points**: See all users' loyalty points balances
4. **Adjust Points**: Manually add bonus points or deduct penalty points with reasons
5. **Monitor Redemptions**: Track all reward redemptions across the platform

---

## Features

### Customer Features

- **Loyalty Dashboard** (`/loyalty`)
  - Points balance display with visual card
  - Three tabs: Rewards, Transaction History, Redemption History
  - Real-time points updates
  - Bilingual support (Arabic/English)

- **Automatic Points Earning**
  - 10 points awarded automatically when booking status changes to "completed"
  - Points are credited immediately
  - Transaction recorded with description "Points earned from booking"

- **Reward Redemption**
  - Browse available rewards with point costs
  - View discount details (percentage, fixed amount, or free service)
  - Redeem rewards with confirmation dialog
  - Insufficient points protection
  - Redemption history tracking

### Admin Features

- **Loyalty Management** (`/admin/loyalty`)
  - Two tabs: Rewards Management, User Points Management
  - Full CRUD operations for rewards
  - User points overview table
  - Manual points adjustment with reason tracking

- **Reward Types**
  - **Percentage Discount**: e.g., 10% off next booking
  - **Fixed Amount Discount**: e.g., 100 EGP off
  - **Free Service**: Complimentary service (no discount value needed)

- **Points Adjustment**
  - Add bonus points (positive values)
  - Deduct penalty points (negative values)
  - Required reason/description for all adjustments
  - Full audit trail in transaction history

---

## Database Schema

### Tables

1. **`loyalty_transactions`**
   - `id`: Auto-increment primary key
   - `userId`: Foreign key to users table
   - `bookingId`: Foreign key to bookings table (nullable)
   - `points`: Points earned or spent (positive for earned, negative for spent)
   - `type`: Transaction type (`earned`, `redeemed`, `bonus`, `penalty`)
   - `description`: Transaction description
   - `createdAt`: Timestamp

2. **`rewards`**
   - `id`: Auto-increment primary key
   - `name`: Reward name (Arabic)
   - `nameEn`: Reward name (English)
   - `description`: Reward description (Arabic, nullable)
   - `descriptionEn`: Reward description (English, nullable)
   - `pointsCost`: Points required to redeem
   - `discountType`: Type of discount (`percentage`, `fixed`, `free_service`)
   - `discountValue`: Discount value (nullable for free_service type)
   - `serviceId`: Specific service this reward applies to (nullable)
   - `active`: Whether reward is currently available
   - `createdAt`: Timestamp

3. **`redemptions`**
   - `id`: Auto-increment primary key
   - `userId`: Foreign key to users table
   - `rewardId`: Foreign key to rewards table (nullable, in case reward is deleted)
   - `pointsSpent`: Points spent on this redemption
   - `status`: Redemption status (`pending`, `applied`, `cancelled`)
   - `createdAt`: Timestamp

4. **`users` (updated)**
   - Added `loyaltyPoints` field (integer, default 0)

---

## API Endpoints

### User Endpoints

- `trpc.loyalty.getPoints.useQuery()` - Get current user's points balance
- `trpc.loyalty.getTransactions.useQuery()` - Get user's transaction history
- `trpc.loyalty.getRewards.useQuery()` - List all active rewards (public)
- `trpc.loyalty.redeemReward.useMutation({ rewardId })` - Redeem a reward
- `trpc.loyalty.getRedemptions.useQuery()` - Get user's redemption history

### Admin Endpoints

- `trpc.loyalty.getAllRewards.useQuery()` - Get all rewards (including inactive)
- `trpc.loyalty.createReward.useMutation(data)` - Create new reward
- `trpc.loyalty.updateReward.useMutation({ id, ...data })` - Update reward
- `trpc.loyalty.deleteReward.useMutation({ id })` - Delete reward
- `trpc.loyalty.getAllUsersWithPoints.useQuery()` - Get all users with points
- `trpc.loyalty.adjustUserPoints.useMutation({ userId, points, description })` - Adjust user points

---

## Sample Rewards

The system comes pre-seeded with 4 sample rewards:

1. **10% Off Next Booking** - 50 points
2. **20% Off Next Booking** - 100 points
3. **100 EGP Discount** - 150 points
4. **Free Single Room Cleaning** - 200 points

---

## Testing

All loyalty features are covered by comprehensive vitest tests (`server/loyalty.test.ts`):

- ✅ Points earning (automatic and manual)
- ✅ Transaction history tracking
- ✅ Reward creation and listing
- ✅ Reward redemption with validation
- ✅ Insufficient points protection
- ✅ Admin points adjustment (bonus/penalty)
- ✅ User points overview

Run tests with:
```bash
pnpm test loyalty.test.ts
```

---

## Translations

All loyalty features are fully translated in both Arabic and English:

- Loyalty dashboard UI
- Reward descriptions
- Transaction types
- Redemption statuses
- Admin interface labels
- Error messages
- Success notifications

---

## Future Enhancements

Potential features for future development:

- **Point Expiration**: Set expiration dates for earned points
- **Tiered Rewards**: Bronze, Silver, Gold membership levels
- **Referral Bonuses**: Earn points for referring new customers
- **Birthday Rewards**: Bonus points on customer's birthday
- **Push Notifications**: Notify users when they earn points or unlock new rewards
- **Reward Categories**: Group rewards by type (discounts, free services, gifts)
- **Limited-Time Offers**: Time-limited rewards with countdown timers
- **Points Multiplier Events**: Double/triple points during special periods

---

## Admin Quick Start

### Creating a New Reward

1. Navigate to **Admin Dashboard** → **Loyalty Management**
2. Click **Create Reward** button
3. Fill in the form:
   - **Name (Arabic)**: e.g., "خصم 15%"
   - **Name (English)**: e.g., "15% Discount"
   - **Description**: Optional detailed description
   - **Points Cost**: e.g., 75
   - **Discount Type**: Choose percentage, fixed, or free_service
   - **Discount Value**: e.g., 15 (not needed for free_service)
   - **Service**: Optional - restrict to specific service
4. Click **Create**

### Adjusting User Points

1. Navigate to **Admin Dashboard** → **Loyalty Management** → **User Points** tab
2. Find the user in the table
3. Click **Adjust Points**
4. Enter:
   - **Points**: Positive number to add, negative to deduct (e.g., 50 or -20)
   - **Reason**: Required description (e.g., "Compensation for service issue")
5. Click **Adjust Points**

---

## Customer Quick Start

### Viewing Your Points

1. Click your profile icon in the header
2. Select **Loyalty Rewards** from the dropdown
3. View your points balance at the top of the page

### Redeeming a Reward

1. Go to **Loyalty Dashboard** → **Rewards** tab
2. Browse available rewards
3. Click **Redeem** on a reward you can afford
4. Confirm the redemption in the dialog
5. Your points will be deducted and the reward will appear in your **Redemptions** tab

---

## Support

For questions or issues with the loyalty program, contact the development team or refer to the main project documentation.
