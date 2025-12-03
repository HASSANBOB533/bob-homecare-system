import { describe, it, expect, beforeAll } from 'vitest';
import {
  getAvailableTimeSlots,
  getAvailabilityCalendar,
  checkTimeSlotAvailability,
  generateDefaultTimeSlots,
  updateTimeSlotCapacity,
  toggleTimeSlotAvailability,
  blockDateRange,
} from './db';

describe('Availability System', () => {
  describe('generateDefaultTimeSlots', () => {
    it('should generate 4 time slots for a date', async () => {
      const date = '2025-12-10'; // Future date
      const slots = await generateDefaultTimeSlots(date);
      
      expect(slots).toHaveLength(4);
      expect(slots[0].startTime).toBe('09:00:00');
      expect(slots[0].endTime).toBe('11:00:00');
      expect(slots[3].startTime).toBe('15:00:00');
      expect(slots[3].endTime).toBe('17:00:00');
    });

    it('should set default capacity to 3', async () => {
      const date = '2025-12-11';
      const slots = await generateDefaultTimeSlots(date);
      
      slots.forEach(slot => {
        expect(slot.capacity).toBe(3);
        expect(slot.bookedCount).toBe(0);
        expect(slot.isAvailable).toBe(true);
      });
    });
  });

  describe('getAvailableTimeSlots', () => {
    it('should return available slots for a date', async () => {
      const date = '2025-12-03'; // Date with seeded slots
      const slots = await getAvailableTimeSlots(date);
      
      expect(Array.isArray(slots)).toBe(true);
      expect(slots.length).toBeGreaterThan(0);
      
      // Check slot structure
      if (slots.length > 0) {
        expect(slots[0]).toHaveProperty('startTime');
        expect(slots[0]).toHaveProperty('endTime');
        expect(slots[0]).toHaveProperty('capacity');
        expect(slots[0]).toHaveProperty('bookedCount');
        expect(slots[0]).toHaveProperty('available');
      }
    });

    it('should calculate availability correctly', async () => {
      const date = '2025-12-04';
      const slots = await getAvailableTimeSlots(date);
      
      slots.forEach(slot => {
        // Available if slot is enabled and not fully booked
        const expectedAvailable = slot.isAvailable && slot.bookedCount < slot.capacity;
        expect(slot.available).toBe(expectedAvailable);
      });
    });
  });

  describe('getAvailabilityCalendar', () => {
    it('should return calendar data for date range', async () => {
      const startDate = '2025-12-03';
      const endDate = '2025-12-10';
      const calendar = await getAvailabilityCalendar(startDate, endDate);
      
      expect(Array.isArray(calendar)).toBe(true);
      expect(calendar.length).toBeGreaterThan(0);
      
      // Check calendar structure
      if (calendar.length > 0) {
        expect(calendar[0]).toHaveProperty('date');
        expect(calendar[0]).toHaveProperty('totalSlots');
        expect(calendar[0]).toHaveProperty('availableSlots');
        expect(calendar[0]).toHaveProperty('hasAvailability');
      }
    });

    it('should calculate hasAvailability correctly', async () => {
      const startDate = '2025-12-03';
      const endDate = '2025-12-05';
      const calendar = await getAvailabilityCalendar(startDate, endDate);
      
      calendar.forEach(day => {
        expect(day.hasAvailability).toBe(day.availableSlots > 0);
      });
    });
  });

  describe('checkTimeSlotAvailability', () => {
    it('should check if a time slot is available', async () => {
      const date = '2025-12-03';
      const time = '09:00:00';
      const result = await checkTimeSlotAvailability(date, time);
      
      expect(result).toHaveProperty('available');
      expect(result).toHaveProperty('reason');
      expect(typeof result.available).toBe('boolean');
    });

    it('should return false for non-existent slots', async () => {
      const date = '2025-12-03';
      const time = '23:00:00'; // Outside working hours
      const result = await checkTimeSlotAvailability(date, time);
      
      expect(result.available).toBe(false);
      expect(result.reason).toContain('No slot found');
    });
  });

  describe('Admin Functions', () => {
    describe('updateTimeSlotCapacity', () => {
      it('should update slot capacity', async () => {
        // Get a slot first
        const date = '2025-12-03';
        const slots = await getAvailableTimeSlots(date);
        
        if (slots.length > 0) {
          const slotId = slots[0].id;
          const newCapacity = 5;
          
          const result = await updateTimeSlotCapacity(slotId, newCapacity);
          expect(result.success).toBe(true);
          
          // Verify the update
          const updatedSlots = await getAvailableTimeSlots(date);
          const updatedSlot = updatedSlots.find(s => s.id === slotId);
          expect(updatedSlot?.capacity).toBe(newCapacity);
        }
      });
    });

    describe('toggleTimeSlotAvailability', () => {
      it('should toggle slot availability', async () => {
        const date = '2025-12-04';
        const slots = await getAvailableTimeSlots(date);
        
        if (slots.length > 0) {
          const slotId = slots[0].id;
          const originalStatus = slots[0].isAvailable;
          
          // Toggle to opposite status
          const result = await toggleTimeSlotAvailability(slotId, !originalStatus);
          expect(result.success).toBe(true);
          
          // Verify the toggle
          const updatedSlots = await getAvailableTimeSlots(date);
          const updatedSlot = updatedSlots.find(s => s.id === slotId);
          expect(updatedSlot?.isAvailable).toBe(!originalStatus);
          
          // Toggle back
          await toggleTimeSlotAvailability(slotId, originalStatus);
        }
      });
    });

    describe('blockDateRange', () => {
      it('should block all slots in date range', async () => {
        const startDate = '2025-12-20';
        const endDate = '2025-12-22';
        
        // First ensure slots exist for these dates
        await generateDefaultTimeSlots('2025-12-20');
        await generateDefaultTimeSlots('2025-12-21');
        await generateDefaultTimeSlots('2025-12-22');
        
        // Block the range
        const result = await blockDateRange(startDate, endDate);
        expect(result.success).toBe(true);
        
        // Verify all slots are blocked
        const slots20 = await getAvailableTimeSlots('2025-12-20');
        const slots21 = await getAvailableTimeSlots('2025-12-21');
        const slots22 = await getAvailableTimeSlots('2025-12-22');
        
        [...slots20, ...slots21, ...slots22].forEach(slot => {
          expect(slot.isAvailable).toBe(false);
        });
      });
    });
  });
});
