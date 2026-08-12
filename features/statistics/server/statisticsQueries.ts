/**
 * ============================================================================
 * FILE: features/statistics/server/statisticsQueries.ts
 * PURPOSE: Server-side database aggregation queries for room usage, employee booking stats, and peak usage hours.
 * IMPORTS: prisma (@/lib/prisma), types (../types), utils (../utils/hourSlots)
 * EXPORTS: getRoomPopularity, getEmployeeStatistics, getPeakHoursPerRoom, getDashboardData
 * ============================================================================
 */

import { prisma } from "@/lib/prisma";
import {
  DashboardData,
  EmployeeStat,
  RoomPeakHours,
  RoomPopularity,
} from "../types";
import { getHourSlotsForBooking, topNSlots } from "../utils/hourSlots";

export async function getRoomPopularity(): Promise<RoomPopularity[]> {
  const rooms = await prisma.room.findMany({
    select: {
      id: true,
      name: true,
      bookings: {
        select: { startTime: true, endTime: true },
      },
    },
  });

  const totalBookingsAcrossAllRooms = rooms.reduce(
    (sum, room) => sum + room.bookings.length,
    0
  );

  const results: RoomPopularity[] = rooms.map((room) => {
    const bookingCount = room.bookings.length;
    const totalHoursBooked = room.bookings.reduce((sum, b) => {
      const hours =
        (b.endTime.getTime() - b.startTime.getTime()) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);

    const percentage =
      totalBookingsAcrossAllRooms > 0
        ? (bookingCount / totalBookingsAcrossAllRooms) * 100
        : 0;

    return {
      roomId: room.id,
      roomName: room.name,
      bookingCount,
      totalHoursBooked: Math.round(totalHoursBooked * 10) / 10,
      percentage: Math.round(percentage * 10) / 10,
    };
  });

  return results.sort((a, b) => b.bookingCount - a.bookingCount);
}

export async function getEmployeeStatistics(): Promise<EmployeeStat[]> {
  const bookings = await prisma.booking.findMany({
    select: {
      userName: true,
      startTime: true,
      endTime: true,
      room: { select: { name: true } },
    },
  });

  const byEmployee = new Map<
    string,
    {
      total: number;
      roomCounts: Map<string, number>;
      slotCounts: Map<number, number>;
    }
  >();

  for (const booking of bookings) {
    if (!byEmployee.has(booking.userName)) {
      byEmployee.set(booking.userName, {
        total: 0,
        roomCounts: new Map(),
        slotCounts: new Map(),
      });
    }
    const entry = byEmployee.get(booking.userName)!;
    entry.total += 1;

    const roomName = booking.room.name;
    entry.roomCounts.set(roomName, (entry.roomCounts.get(roomName) ?? 0) + 1);

    const hours = getHourSlotsForBooking(booking.startTime, booking.endTime);
    for (const hour of hours) {
      entry.slotCounts.set(hour, (entry.slotCounts.get(hour) ?? 0) + 1);
    }
  }

  const results: EmployeeStat[] = Array.from(byEmployee.entries()).map(
    ([userName, data]) => {
      let favoriteRoom: EmployeeStat["favoriteRoom"] = null;
      let maxRoomCount = 0;
      for (const [roomName, count] of data.roomCounts.entries()) {
        if (count > maxRoomCount) {
          maxRoomCount = count;
          favoriteRoom = { roomName, count };
        }
      }

      return {
        userName,
        totalBookings: data.total,
        favoriteRoom,
        topTimeSlots: topNSlots(data.slotCounts, 3),
      };
    }
  );

  return results.sort((a, b) => b.totalBookings - a.totalBookings);
}

export async function getPeakHoursPerRoom(): Promise<RoomPeakHours[]> {
  const rooms = await prisma.room.findMany({
    select: {
      id: true,
      name: true,
      bookings: {
        select: { startTime: true, endTime: true },
      },
    },
  });

  return rooms.map((room) => {
    const slotCounts = new Map<number, number>();

    for (const booking of room.bookings) {
      const hours = getHourSlotsForBooking(booking.startTime, booking.endTime);
      for (const hour of hours) {
        slotCounts.set(hour, (slotCounts.get(hour) ?? 0) + 1);
      }
    }

    return {
      roomId: room.id,
      roomName: room.name,
      peakSlots: topNSlots(slotCounts, 3),
    };
  });
}

export async function getDashboardData(): Promise<DashboardData> {
  const [roomPopularity, employeeStats, roomPeakHours] = await Promise.all([
    getRoomPopularity(),
    getEmployeeStatistics(),
    getPeakHoursPerRoom(),
  ]);

  return { roomPopularity, employeeStats, roomPeakHours };
}