import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { sendBookingConfirmation } from "./whatsapp";

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
  }),

  services: router({
    list: publicProcedure.query(async () => {
      const { getAllServices } = await import("./db");
      return getAllServices();
    }),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
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
    createPublic: publicProcedure
      .input(z.object({
        serviceId: z.number(),
        date: z.string(),
        time: z.string(),
        customerName: z.string().min(1),
        customerEmail: z.string().optional(),
        customerPhone: z.string().min(1),
        address: z.string().min(1),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { createPublicBooking } = await import("./db");
        // Combine date and time into dateTime
        const dateTime = new Date(`${input.date}T${input.time}`);
        return createPublicBooking({
          serviceId: input.serviceId,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          address: input.address,
          dateTime,
          notes: input.notes,
        });
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
        const { createBooking } = await import("./db");
        return createBooking({ ...input, userId: ctx.user.id });
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
        const { getBookingById, updateBooking } = await import("./db");
        const booking = await getBookingById(input.id);
        if (!booking) throw new Error("Booking not found");
        
        // Users can only update their own bookings, admins can update any
        if (ctx.user.role !== "admin" && booking.userId !== ctx.user.id) {
          throw new Error("Not authorized");
        }
        
        const { id, ...data } = input;
        await updateBooking(id, data);
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
    sendWhatsAppConfirmation: protectedProcedure
      .input(z.object({ bookingId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can send confirmations");
        }
        
        const { getBookingById } = await import("./db");
        const booking = await getBookingById(input.bookingId);
        if (!booking) {
          throw new Error('Booking not found');
        }
        
        const result = await sendBookingConfirmation({
          customerName: booking.customerName,
          customerPhone: booking.phone || '',
          serviceName: booking.serviceName || 'Service',
          dateTime: booking.dateTime,
          address: booking.address,
          bookingId: booking.id,
        });
        
        return result;
      }),
  }),
});

export type AppRouter = typeof appRouter;
