/**
 * ============================================================================
 * FILE: features/statistics/types/index.ts
 * PURPOSE: Shared domain types for room popularity, employee statistics, and peak hour metrics.
 * IMPORTS: None
 * EXPORTS: RoomPopularity, TimeSlot, EmployeeStat, RoomPeakHours, DashboardData
 * ============================================================================
 */

export interface RoomPopularity {
  roomId: string;
  roomName: string;
  bookingCount: number;
  totalHoursBooked: number;
  percentage: number;
}

export interface TimeSlot {
  hour: number;      // 0 to 23 representing start hour
  label: string;     // Formatted display string, e.g. "09:00 - 10:00"
  count: number;     // Number of bookings active during this hour
}

export interface EmployeeStat {
  userName: string;
  totalBookings: number;
  favoriteRoom: {
    roomName: string;
    count: number;
  } | null;
  topTimeSlots: TimeSlot[];
}

export interface RoomPeakHours {
  roomId: string;
  roomName: string;
  peakSlots: TimeSlot[];
}

export interface DashboardData {
  roomPopularity: RoomPopularity[];
  employeeStats: EmployeeStat[];
  roomPeakHours: RoomPeakHours[];
}