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
        });
        
        // Check notification preferences if user has an account
        let whatsappEnabled = true; // Default to true for public bookings
        if (input.customerEmail) {
          const user = await getUserByEmail(input.customerEmail);
          if (user) {
            whatsappEnabled = user.whatsappNotifications ?? true;
          }
        }
        
        // Send WhatsApp confirmation if phone is provided and user hasn't disabled it
        if (input.phone && whatsappEnabled) {
          const service = await getServiceById(input.serviceId);
          await sendBookingConfirmation(input.phone, {
            customerName: input.customerName,
            serviceName: service?.nameEn || service?.name || 'Cleaning Service',
            dateTime,
            address: input.address,
          });
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
        
        // Send WhatsApp confirmation if phone is provided and user hasn't disabled it
        if (input.phone && ctx.user.whatsappNotifications !== false) {
          const service = input.serviceId ? await getServiceById(input.serviceId) : null;
          await sendBookingConfirmation(input.phone, {
            customerName: input.customerName,
            serviceName: service?.nameEn || service?.name || 'Cleaning Service',
            dateTime: input.dateTime,
            address: input.address,
          });
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
        const { getBookingById, updateBooking, awardLoyaltyPoints } = await import("./db");
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
        
        await deleteBooking(input.id);
        return { success: true };
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
        const { redeemReward } = await import("./db");
        return redeemReward(ctx.user.id, input.rewardId);
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
});

export type AppRouter = typeof appRouter;
