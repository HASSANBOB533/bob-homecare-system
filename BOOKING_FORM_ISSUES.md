# Booking Form Issues - Current Status

## ✅ WORKING
- Bedroom selector displays correct prices (1,500 - 5,000 EGP)
- Pricing components render when service is selected
- Price formatting fixed (divided by 100)

## ❌ CRITICAL ISSUES

### 1. Duplicate Add-Ons (6x repetition)
**Problem:** Each add-on appears 6 times because add-ons with bedroom tiers are being displayed once per tier

**Example:**
- "خدمة الغسيل" (Laundry) × 6
- "تنظيف الحديقة/الشرفة" (Garden) × 6
- "تنظيف أدوات المطبخ والفرن" (Kitchen) × 6

**Root Cause:** `getAddOnsByService()` returns all add-on records including tier variations. The add-ons table has:
- 4 base add-ons (Laundry, Garden, Kitchen Deep, Kitchen Tools)
- Each with 6 bedroom tiers
- Total: 24 records for one service

**Solution:** Group add-ons by `name` and show only unique add-ons, then automatically select the appropriate tier based on selected bedrooms

### 2. Duplicate Special Offers (6x repetition)
**Problem:** Each special offer appears 6 times

**Example:**
- "برنامج الإحالة" (Referral) × 6
- "خدمة الطوارئ" (Emergency) × 6
- "خصم مدير العقارات" (Property Manager) × 6

**Root Cause:** Similar to add-ons - special offers are being duplicated

**Solution:** Deduplicate special offers by `name` or `id`

### 3. Wrong Special Offer Display
**Problem:** Shows "+10% إضافة" (Add 10%) instead of "-10% خصم" (10% Discount)

**Solution:** Fix the display logic to show discounts as negative percentages with proper Arabic text

## NEXT STEPS
1. Fix add-on deduplication in `AddOnsSelector` component
2. Fix special offer deduplication in `DiscountsSelector` component  
3. Fix special offer display text (discount vs. addition)
4. Test complete booking flow with corrected pricing
