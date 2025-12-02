import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { updateUserProfile } = await import("./db");
        return updateUserProfile(ctx.user.id, input);
      }),
    sendVerificationEmail: protectedProcedure
      .mutation(async ({ ctx, input }) => {
        const { generateVerificationToken, getUserById } = await import("./db");
        const { sendVerificationEmail } = await import("./_core/email");
        const user = await getUserById(ctx.user.id);
        
        if (!user?.email) {
          throw new Error("No email address found");
        }
        
        const token = await generateVerificationToken(ctx.user.id);
        
        // Get base URL from request or use default
        const baseUrl = process.env.VITE_APP_URL || 'http://localhost:3000';
        
        // Send verification email
        const emailResult = await sendVerificationEmail(user.email, token, baseUrl);
        
        if (!emailResult.success) {
          // If email fails, still return success but log the error
          console.error(`[Email] Failed to send verification email: ${emailResult.error}`);
          // Return token in development for testing
          return { success: true, token, emailSent: false };
        }
        
        console.log(`[Email Verification] Sent verification email to ${user.email}`);
        
        // In development, return token for testing; in production, don't return it
        const isDev = process.env.NODE_ENV !== 'production';
        return { success: true, emailSent: true, ...(isDev && { token }) };
      }),
    verifyEmail: protectedProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const { verifyEmailToken } = await import("./db");
        const success = await verifyEmailToken(input.token);
        if (!success) {
          throw new Error("Invalid or expired verification token");
        }
        return { success: true };
      }),
    updateNotificationPreferences: protectedProcedure
      .input(z.object({
        emailNotifications: z.boolean().optional(),
        whatsappNotifications: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { updateNotificationPreferences } = await import("./db");
        return updateNotificationPreferences(ctx.user.id, input);
      }),
  }),

  services: router({
    list: publicProcedure.query(async () => {
      const { getAllServices } = await import("./db");
      return getAllServices();
    }),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        nameEn: z.string().optional(),
        description: z.string().optional(),
        descriptionEn: z.string().optional(),
        price: z.number().optional(),
        duration: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can create services");
        }
        const { createService } = await import("./db");
        return createService(input);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can delete services");
        }
        const { deleteService } = await import("./db");
        await deleteService(input.id);
        return { success: true };
      }),
    uploadImage: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileType: z.string(),
        fileData: z.string(), // Base64 encoded image data
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can upload images");
        }
        const { storagePut } = await import("./storage");
        
        // Generate unique file name
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(7);
        const fileKey = `service-gallery/${timestamp}-${randomSuffix}-${input.fileName}`;
        
        // Convert base64 to buffer
        const base64Data = input.fileData.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        
        // Upload to S3
        const { url } = await storagePut(fileKey, buffer, input.fileType);
        
        return { url };
      }),
    updateGallery: protectedProcedure
      .input(z.object({
        serviceId: z.number(),
        galleryImages: z.array(z.string()),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can update gallery images");
        }
        const { updateServiceGallery } = await import("./db");
        return updateServiceGallery(input.serviceId, input.galleryImages);
      }),
  }),

  bookings: router({
    myBookings: protectedProcedure.query(async ({ ctx }) => {
      const { getUserBookings } = await import("./db");
      return getUserBookings(ctx.user.id);
    }),
    upcomingBookings: protectedProcedure.query(async ({ ctx }) => {
      const { getUpcomingBookings } = await import("./db");
      return getUpcomingBookings(ctx.user.id, 3);
    }),
       createPublic: publicProcedure
      .input(z.object({
        serviceId: z.number(),
        date: z.string(),
        time: z.string(),
        customerName: z.string().min(1),
        customerEmail: z.string().optional(),
        phone: z.string().min(1),
        address: z.string().min(1),
        notes: z.string().optional(),
        amount: z.number().optional(), // Total price in cents
        pricingBreakdown: z.any().optional(), // Detailed pricing breakdown
      }))
      .mutation(async ({ input }) => {
        const { createPublicBooking, getServiceById, getUserByEmail } = await import("./db");
        const { sendBookingConfirmation } = await import("./_core/whatsapp");
        
        const dateTime = new Date(`${input.date}T${input.time}`);
        const booking = await createPublicBooking({
          serviceId: input.serviceId,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.phone,
          address: input.address,
          dateTime,
          notes: input.notes,
          amount: input.amount,
          pricingBreakdown: input.pricingBreakdown,
        });
        
        // Check notification preferences if user has an account
        let whatsappEnabled = true; // Default to true for public bookings

        if (input.customerEmail) {
          const user = await getUserByEmail(input.customerEmail);
          if (user) {
            whatsappEnabled = user.whatsappNotifications ?? true;
          }
        }
        
        if (input.phone) {
          const service = await getServiceById(input.serviceId);
          const serviceName = service?.nameEn || service?.name || 'Cleaning Service';
          
          // Send WhatsApp confirmation if enabled
          if (whatsappEnabled) {
            await sendBookingConfirmation(input.phone, {
              customerName: input.customerName,
              serviceName,
              dateTime,
              address: input.address,
            });
          }
          
          // Send email confirmation if email provided and pricing breakdown available
          if (input.customerEmail && input.pricingBreakdown && input.amount) {
            const { sendEmail } = await import("./emailSender");
            const { generateBookingConfirmationEmail } = await import("./emailTemplates");
            
            const emailData = generateBookingConfirmationEmail({
              customerName: input.customerName,
              serviceName,
              date: input.date,
              time: input.time,
              address: input.address,
              pricingBreakdown: {
                basePrice: input.pricingBreakdown.basePrice || 0,
                addOns: input.pricingBreakdown.addOns || [],
                packageDiscount: input.pricingBreakdown.packageDiscount,
                specialOffer: input.pricingBreakdown.specialOffer,
                finalPrice: input.amount,
              },
              bookingReference: `BOB-${booking.id}`,
              language: "en", // Default to English, can be made dynamic based on user preference
            });
            
            // Send email (don't fail booking if email fails)
            await sendEmail({
              to: input.customerEmail,
              subject: emailData.subject,
              html: emailData.html,
              text: emailData.text,
            }).catch(err => console.error("Failed to send booking confirmation email:", err));
          }

        }
        
        return booking;
      }),
    checkStatus: publicProcedure
      .input(z.object({
        id: z.number(),
        phone: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { getBookingByIdAndPhone } = await import("./db");
        return getBookingByIdAndPhone(input.id, input.phone);
      }),
    allBookings: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Only admins can view all bookings");
      }
      const { getAllBookings } = await import("./db");
      return getAllBookings();
    }),
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can update booking status");
        }
        const { updateBooking } = await import("./db");
        return updateBooking(input.id, { status: input.status });
      }),
    downloadInvoice: protectedProcedure
      .input(z.object({
        bookingId: z.number(),
        language: z.enum(["ar", "en"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const { bookings, services } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        // Get booking with service details
        const result = await db.select({
          booking: bookings,
          service: services,
        }).from(bookings)
          .leftJoin(services, eq(bookings.serviceId, services.id))
          .where(eq(bookings.id, input.bookingId))
          .limit(1);
        
        if (!result[0]) {
          throw new Error("Booking not found");
        }
        
        const { booking, service } = result[0];
        
        // Verify user owns this booking
        if (booking.userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new Error("Unauthorized");
        }
        
        const { generateInvoicePDF } = await import("./invoiceGenerator");
        
        const pricingBreakdown = typeof booking.pricingBreakdown === 'string' 
          ? JSON.parse(booking.pricingBreakdown) 
          : booking.pricingBreakdown;
        
        const pdf = await generateInvoicePDF({
          bookingReference: `BOB-${booking.id}`,
          customerName: booking.customerName,
          serviceName: input.language === "ar" ? (service?.name || "N/A") : (service?.nameEn || service?.name || "N/A"),
          date: booking.dateTime.toLocaleDateString(input.language === "ar" ? "ar-EG" : "en-US"),
          time: booking.dateTime.toLocaleTimeString(input.language === "ar" ? "ar-EG" : "en-US", { hour: '2-digit', minute: '2-digit' }),
          address: booking.address,
          pricingBreakdown,
          totalAmount: booking.amount || 0,
          language: input.language || "en",
        });
        
        return {
          pdf: pdf.toString("base64"),
          filename: `BOB-Invoice-${booking.id}.pdf`,
        };
      }),
    create: protectedProcedure
      .input(z.object({
        serviceId: z.number().optional(),
        customerName: z.string().min(1),
        address: z.string().min(1),
        phone: z.string().optional(),
        dateTime: z.date(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { createBooking, getServiceById } = await import("./db");
        const { sendBookingConfirmation } = await import("./_core/whatsapp");
        
        const booking = await createBooking({ ...input, userId: ctx.user.id });
        
        if (input.phone) {
          const service = input.serviceId ? await getServiceById(input.serviceId) : null;
          const serviceName = service?.nameEn || service?.name || 'Cleaning Service';
          
          // Send WhatsApp confirmation if enabled
          if (ctx.user.whatsappNotifications !== false) {
            await sendBookingConfirmation(input.phone, {
              customerName: input.customerName,
              serviceName,
              dateTime: input.dateTime,
              address: input.address,
            });
          }

        }
        
        return booking;
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        customerName: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        dateTime: z.date().optional(),
        serviceId: z.number().optional(),
        status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { getBookingById, updateBooking, awardLoyaltyPoints, getUserLoyaltyPoints, getUserById } = await import("./db");

        
        const booking = await getBookingById(input.id);
        if (!booking) throw new Error("Booking not found");
        
        // Users can only update their own bookings, admins can update any
        if (ctx.user.role !== "admin" && booking.userId !== ctx.user.id) {
          throw new Error("Not authorized");
        }
        
        const { id, ...data } = input;
        
        // Check if status is being changed to "completed" and award points
        const wasCompleted = booking.status === "completed";
        const isNowCompleted = input.status === "completed";
        
        await updateBooking(id, data);
        
        // Award loyalty points when booking is completed (only once)
        if (!wasCompleted && isNowCompleted && booking.userId) {
          await awardLoyaltyPoints(booking.userId, booking.id, 10);
        }
        
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { getBookingById, deleteBooking } = await import("./db");
        const booking = await getBookingById(input.id);
        if (!booking) throw new Error("Booking not found");
        
        // Users can only delete their own bookings, admins can delete any
        if (ctx.user.role !== "admin" && booking.userId !== ctx.user.id) {
          throw new Error("Not authorized");
        }
        
        return deleteBooking(input.id);
      }),
    initiatePayment: publicProcedure
      .input(z.object({
        bookingId: z.number(),
        serviceId: z.number(),
        customerName: z.string(),
        customerEmail: z.string().email(),
        phone: z.string(),
        address: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { getServiceById, updateBookingPayment } = await import("./db");
        const { initiatePaymobPayment, isPaymobConfigured } = await import("./_core/paymob");
        
        if (!isPaymobConfigured()) {
          throw new Error("Payment gateway not configured");
        }
        
        // Get service price
        const service = await getServiceById(input.serviceId);
        if (!service) {
          throw new Error("Service not found");
        }
        
        if (!service.price || service.price === 0) {
          throw new Error("Service price not set");
        }
        
        // Prepare billing data
        const [firstName, ...lastNameParts] = input.customerName.split(" ");
        const billingData = {
          first_name: firstName || input.customerName,
          last_name: lastNameParts.join(" ") || firstName,
          email: input.customerEmail,
          phone_number: input.phone,
          street: input.address,
          city: "Cairo",
          country: "EG",
        };
        
        // Initiate payment with Paymob
        const paymentResult = await initiatePaymobPayment(
          service.price,
          input.bookingId,
          billingData
        );
        
        // Update booking with payment info
        await updateBookingPayment(input.bookingId, {
          paymentId: paymentResult.orderId.toString(),
          paymentStatus: "pending",
          amount: service.price,
        });
        
        return {
          iframeUrl: paymentResult.iframeUrl,
          paymentToken: paymentResult.paymentToken,
          amount: service.price,
        };
      }),
  }),

  reviews: router({
    create: protectedProcedure
      .input(z.object({
        bookingId: z.number(),
        serviceId: z.number(),
        rating: z.number().min(1).max(5),
        reviewText: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { createReview, getUserReviewForBooking } = await import("./db");
        
        // Check if user already reviewed this booking
        const existingReview = await getUserReviewForBooking(ctx.user.id, input.bookingId);
        if (existingReview) {
          throw new Error("You have already reviewed this booking");
        }
        
        return createReview({
          ...input,
          userId: ctx.user.id,
        });
      }),
    getServiceReviews: publicProcedure
      .input(z.object({ serviceId: z.number() }))
      .query(async ({ input }) => {
        const { getServiceReviews } = await import("./db");
        const allReviews = await getServiceReviews(input.serviceId);
        // Only return approved reviews to public
        return allReviews.filter((review: any) => review.status === "approved");
      }),
    getServiceRating: publicProcedure
      .input(z.object({ serviceId: z.number() }))
      .query(async ({ input }) => {
        const { getServiceAverageRating } = await import("./db");
        return getServiceAverageRating(input.serviceId);
      }),
    myReviews: protectedProcedure
      .query(async ({ ctx }) => {
        const { getUserReviews } = await import("./db");
        return getUserReviews(ctx.user.id);
      }),
    myStats: protectedProcedure
      .query(async ({ ctx }) => {
        const { getUserReviewStats } = await import("./db");
        return getUserReviewStats(ctx.user.id);
      }),
    // Admin endpoints
    allReviews: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can view all reviews");
        }
        const { getAllReviews } = await import("./db");
        return getAllReviews();
      }),
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "approved", "rejected"]),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can update review status");
        }
        const { updateReviewStatus } = await import("./db");
        return updateReviewStatus(input.id, input.status);
      }),
    updateContent: protectedProcedure
      .input(z.object({
        id: z.number(),
        rating: z.number().min(1).max(5).optional(),
        reviewText: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can edit reviews");
        }
        const { updateReviewContent } = await import("./db");
        const { id, ...data } = input;
        return updateReviewContent(id, data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can delete reviews");
        }
        const { deleteReview } = await import("./db");
        return deleteReview(input.id);
      }),
  }),

  loyalty: router({
    // User endpoints
    getPoints: protectedProcedure
      .query(async ({ ctx }) => {
        const { getUserLoyaltyPoints } = await import("./db");
        return getUserLoyaltyPoints(ctx.user.id);
      }),
    getTransactions: protectedProcedure
      .query(async ({ ctx }) => {
        const { getLoyaltyTransactions } = await import("./db");
        return getLoyaltyTransactions(ctx.user.id);
      }),
    getRewards: publicProcedure
      .query(async () => {
        const { getActiveRewards } = await import("./db");
        return getActiveRewards();
      }),
    redeemReward: protectedProcedure
      .input(z.object({ rewardId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { redeemReward, getUserLoyaltyPoints } = await import("./db");

        
        const result = await redeemReward(ctx.user.id, input.rewardId);
        

        
        return result;
      }),
    getRedemptions: protectedProcedure
      .query(async ({ ctx }) => {
        const { getUserRedemptions } = await import("./db");
        return getUserRedemptions(ctx.user.id);
      }),
    
    // Admin endpoints
    getAllRewards: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can view all rewards");
        }
        const { getAllRewards } = await import("./db");
        return getAllRewards();
      }),
    createReward: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        nameEn: z.string().min(1),
        description: z.string().optional(),
        descriptionEn: z.string().optional(),
        pointsCost: z.number().min(1),
        discountType: z.enum(["percentage", "fixed", "free_service"]),
        discountValue: z.number().optional(),
        serviceId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can create rewards");
        }
        const { createReward } = await import("./db");
        return createReward(input);
      }),
    updateReward: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        nameEn: z.string().optional(),
        description: z.string().optional(),
        descriptionEn: z.string().optional(),
        pointsCost: z.number().optional(),
        discountType: z.enum(["percentage", "fixed", "free_service"]).optional(),
        discountValue: z.number().optional(),
        serviceId: z.number().optional(),
        active: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can update rewards");
        }
        const { updateReward } = await import("./db");
        const { id, ...data } = input;
        return updateReward(id, data);
      }),
    deleteReward: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can delete rewards");
        }
        const { deleteReward } = await import("./db");
        return deleteReward(input.id);
      }),
    getAllUsersWithPoints: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can view all users");
        }
        const { getAllUsersWithPoints } = await import("./db");
        return getAllUsersWithPoints();
      }),
    adjustUserPoints: protectedProcedure
      .input(z.object({
        userId: z.number(),
        points: z.number(),
        description: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can adjust user points");
        }
        const { adjustUserPoints } = await import("./db");
        return adjustUserPoints(input.userId, input.points, input.description);
      }),
  }),
  
  // Pricing Management
  pricing: router({
    seedAllPricing: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can seed pricing data");
        }
        const { seedPricingData } = await import("./pricing-seed");
        return seedPricingData();
      }),
    
    // Get service by ID
    getServiceById: publicProcedure
      .input(z.object({ serviceId: z.number() }))
      .query(async ({ input }) => {
        const { getServiceById } = await import("./db");
        return getServiceById(input.serviceId);
      }),
    
    // Get complete pricing data for a service (tiers, sqm, items, add-ons)
    getPricingData: publicProcedure
      .input(z.object({ serviceId: z.number() }))
      .query(async ({ input }) => {
        const { getServicePricingData } = await import("./db");
        return getServicePricingData(input.serviceId);
      }),
    
    // Get pricing data for a specific service
    getServicePricing: publicProcedure
      .input(z.object({ serviceId: z.number() }))
      .query(async ({ input }) => {
        const { getServicePricingData } = await import("./db");
        return getServicePricingData(input.serviceId);
      }),
    
    // Get add-ons for a specific service
    getAddOns: publicProcedure
      .input(z.object({ serviceId: z.number() }))
      .query(async ({ input }) => {
        const { getAddOnsByService } = await import("./db");
        return getAddOnsByService(input.serviceId);
      }),
    
    // Get package discounts for a service
    getPackageDiscounts: publicProcedure
      .input(z.object({ serviceId: z.number() }))
      .query(async ({ input }) => {
        const { getPackageDiscountsByService } = await import("./db");
        return getPackageDiscountsByService(input.serviceId);
      }),
    
    // Get special offers
    getSpecialOffers: publicProcedure
      .query(async () => {
        const { getAllSpecialOffers } = await import("./db");
        return getAllSpecialOffers();
      }),
    
    // ===== BEDROOM TIER CRUD =====
    createBedroomTier: protectedProcedure
      .input(z.object({
        serviceId: z.number(),
        bedrooms: z.number().min(1),
        price: z.number().min(0),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can create pricing");
        }
        const { createBedroomTier } = await import("./db");
        return createBedroomTier(input);
      }),
    
    updateBedroomTier: protectedProcedure
      .input(z.object({
        id: z.number(),
        bedrooms: z.number().min(1).optional(),
        price: z.number().min(0).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can update pricing");
        }
        const { updateBedroomTier } = await import("./db");
        return updateBedroomTier(input.id, input);
      }),
    
    deleteBedroomTier: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can delete pricing");
        }
        const { deleteBedroomTier } = await import("./db");
        return deleteBedroomTier(input.id);
      }),
    
    // ===== SQUARE METER PRICING CRUD =====
    createSqmPricing: protectedProcedure
      .input(z.object({
        serviceId: z.number(),
        variant: z.string().optional(),
        pricePerSqm: z.number().min(0),
        minimumCharge: z.number().min(0),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can create pricing");
        }
        const { createSqmPricing } = await import("./db");
        return createSqmPricing(input);
      }),
    
    updateSqmPricing: protectedProcedure
      .input(z.object({
        id: z.number(),
        variant: z.string().optional(),
        pricePerSqm: z.number().min(0).optional(),
        minimumCharge: z.number().min(0).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can update pricing");
        }
        const { updateSqmPricing } = await import("./db");
        return updateSqmPricing(input.id, input);
      }),
    
    deleteSqmPricing: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can delete pricing");
        }
        const { deleteSqmPricing } = await import("./db");
        return deleteSqmPricing(input.id);
      }),
    
    // ===== UPHOLSTERY ITEM CRUD =====
    createUpholsteryItem: protectedProcedure
      .input(z.object({
        serviceId: z.number(),
        itemName: z.string(),
        itemNameEn: z.string(),
        price: z.number().min(0),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can create pricing");
        }
        const { createUpholsteryItem } = await import("./db");
        return createUpholsteryItem(input);
      }),
    
    updateUpholsteryItem: protectedProcedure
      .input(z.object({
        id: z.number(),
        itemName: z.string().optional(),
        itemNameEn: z.string().optional(),
        price: z.number().min(0).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can update pricing");
        }
        const { updateUpholsteryItem } = await import("./db");
        return updateUpholsteryItem(input.id, input);
      }),
    
    deleteUpholsteryItem: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can delete pricing");
        }
        const { deleteUpholsteryItem } = await import("./db");
        return deleteUpholsteryItem(input.id);
      }),
    
    // ===== ADD-ON CRUD =====
    createAddOn: protectedProcedure
      .input(z.object({
        serviceId: z.number().optional(),
        name: z.string(),
        nameEn: z.string(),
        description: z.string().optional(),
        descriptionEn: z.string().optional(),
        price: z.number().min(0),
        pricingType: z.enum(["FIXED", "PER_BEDROOM", "SIZE_TIERED"]).optional(),
        sizeTierThreshold: z.number().optional(),
        sizeTierMultiplier: z.number().optional(),
        active: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can create add-ons");
        }
        const { createAddOn } = await import("./db");
        return createAddOn(input);
      }),
    
    updateAddOn: protectedProcedure
      .input(z.object({
        id: z.number(),
        serviceId: z.number().optional(),
        name: z.string().optional(),
        nameEn: z.string().optional(),
        description: z.string().optional(),
        descriptionEn: z.string().optional(),
        price: z.number().min(0).optional(),
        pricingType: z.enum(["FIXED", "PER_BEDROOM", "SIZE_TIERED"]).optional(),
        sizeTierThreshold: z.number().optional(),
        sizeTierMultiplier: z.number().optional(),
        active: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can update add-ons");
        }
        const { updateAddOn } = await import("./db");
        return updateAddOn(input.id, input);
      }),
    
    deleteAddOn: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can delete add-ons");
        }
        const { deleteAddOn } = await import("./db");
        return deleteAddOn(input.id);
      }),
    
    // ===== ADD-ON TIER CRUD =====
    createAddOnTier: protectedProcedure
      .input(z.object({
        addOnId: z.number(),
        bedrooms: z.number().min(1),
        price: z.number().min(0),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can create add-on tiers");
        }
        const { createAddOnTier } = await import("./db");
        return createAddOnTier(input);
      }),
    
    updateAddOnTier: protectedProcedure
      .input(z.object({
        id: z.number(),
        bedrooms: z.number().min(1).optional(),
        price: z.number().min(0).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can update add-on tiers");
        }
        const { updateAddOnTier } = await import("./db");
        return updateAddOnTier(input.id, input);
      }),
    
    deleteAddOnTier: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can delete add-on tiers");
        }
        const { deleteAddOnTier } = await import("./db");
        return deleteAddOnTier(input.id);
      }),
    
    // ===== PACKAGE DISCOUNT CRUD =====
    createPackageDiscount: protectedProcedure
      .input(z.object({
        serviceId: z.number(),
        visits: z.number().min(1),
        discountPercentage: z.number().min(0).max(100),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can create discounts");
        }
        const { createPackageDiscount } = await import("./db");
        return createPackageDiscount(input);
      }),
    
    updatePackageDiscount: protectedProcedure
      .input(z.object({
        id: z.number(),
        visits: z.number().min(1).optional(),
        discountPercentage: z.number().min(0).max(100).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can update discounts");
        }
        const { updatePackageDiscount } = await import("./db");
        return updatePackageDiscount(input.id, input);
      }),
    
    deletePackageDiscount: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can delete discounts");
        }
        const { deletePackageDiscount } = await import("./db");
        return deletePackageDiscount(input.id);
      }),
    
    // ===== SPECIAL OFFER CRUD =====
    createSpecialOffer: protectedProcedure
      .input(z.object({
        name: z.string(),
        nameEn: z.string(),
        description: z.string().optional(),
        descriptionEn: z.string().optional(),
        offerType: z.enum(["REFERRAL", "PROPERTY_MANAGER", "EMERGENCY_SAME_DAY"]),
        discountType: z.enum(["percentage", "fixed"]),
        discountValue: z.number(),
        minProperties: z.number().optional(),
        maxDiscount: z.number().optional(),
        active: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can create offers");
        }
        const { createSpecialOffer } = await import("./db");
        return createSpecialOffer(input);
      }),
    
    updateSpecialOffer: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        nameEn: z.string().optional(),
        description: z.string().optional(),
        descriptionEn: z.string().optional(),
        offerType: z.enum(["REFERRAL", "PROPERTY_MANAGER", "EMERGENCY_SAME_DAY"]).optional(),
        discountType: z.enum(["percentage", "fixed"]).optional(),
        discountValue: z.number().optional(),
        minProperties: z.number().optional(),
        maxDiscount: z.number().optional(),
        active: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can update offers");
        }
        const { updateSpecialOffer } = await import("./db");
        return updateSpecialOffer(input.id, input);
      }),
    
    deleteSpecialOffer: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can delete offers");
        }
        const { deleteSpecialOffer } = await import("./db");
        return deleteSpecialOffer(input.id);
      }),
    
    // Download service checklist as PDF
    downloadChecklist: publicProcedure
      .input(z.object({ serviceId: z.number(), language: z.enum(["ar", "en"]).optional() }))
      .mutation(async ({ input }) => {
        const { getServiceById } = await import("./db");
        const { generateChecklistPDF } = await import("./pdfGenerator");
        
        const service = await getServiceById(input.serviceId);
        if (!service) {
          throw new Error("Service not found");
        }
        
        // Get checklist from service (already parsed by Drizzle)
        const checklist = service.checklist || [];
        
        const pdfBuffer = await generateChecklistPDF({
          serviceName: service.name,
          serviceNameEn: service.nameEn || undefined,
          checklist,
          language: input.language || "en",
        });
        
        // Convert buffer to base64 for transmission
        const base64Pdf = pdfBuffer.toString("base64");
        
        return {
          pdf: base64Pdf,
          filename: `${service.nameEn || service.name}-checklist.pdf`,
        };
      }),
  }),

  // Quote management
  quote: router({
    // Create a new quote
    create: publicProcedure
      .input(
        z.object({
          serviceId: z.number(),
          selections: z.object({
            bedrooms: z.number().optional(),
            squareMeters: z.number().optional(),
            selectedItems: z.array(z.object({ itemId: z.number(), quantity: z.number() })).optional(),
            addOns: z.array(z.object({ addOnId: z.number(), quantity: z.number().optional() })).optional(),
            packageDiscountId: z.number().optional(),
            specialOfferId: z.number().optional(),
            date: z.string().optional(),
            time: z.string().optional(),
            address: z.string().optional(),
            notes: z.string().optional(),
          }),
          totalPrice: z.number(),
          customerName: z.string().optional(),
          customerEmail: z.string().optional(),
          customerPhone: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { createQuote } = await import("./db");
        return createQuote({
          ...input,
          userId: ctx.user?.id,
        });
      }),

    // Get quote by code
    getByCode: publicProcedure
      .input(z.object({ code: z.string() }))
      .query(async ({ input }) => {
        const { getQuoteByCode } = await import("./db");
        return getQuoteByCode(input.code);
      }),

    // Update quote
    update: publicProcedure
      .input(
        z.object({
          id: z.number(),
          selections: z.object({
            bedrooms: z.number().optional(),
            squareMeters: z.number().optional(),
            selectedItems: z.array(z.object({ itemId: z.number(), quantity: z.number() })).optional(),
            addOns: z.array(z.object({ addOnId: z.number(), quantity: z.number().optional() })).optional(),
            packageDiscountId: z.number().optional(),
            specialOfferId: z.number().optional(),
            date: z.string().optional(),
            time: z.string().optional(),
            address: z.string().optional(),
            notes: z.string().optional(),
          }),
          totalPrice: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        const { updateQuote } = await import("./db");
        return updateQuote(input.id, {
          selections: input.selections,
          totalPrice: input.totalPrice,
        });
      }),

    // Mark quote as converted to booking
    markConverted: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { markQuoteConverted } = await import("./db");
        return markQuoteConverted(input.id);
      }),
  }),

  // Favorites router
  favorites: router({
    // Toggle favorite (add or remove)
    toggle: protectedProcedure
      .input(z.object({ serviceId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { toggleFavorite } = await import("./db");
        return toggleFavorite(ctx.user.id, input.serviceId);
      }),

    // Get user's favorite services
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getUserFavorites } = await import("./db");
      return getUserFavorites(ctx.user.id);
    }),

    // Check if service is favorited
    isFavorite: protectedProcedure
      .input(z.object({ serviceId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { isFavoriteService } = await import("./db");
        return isFavoriteService(ctx.user.id, input.serviceId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
