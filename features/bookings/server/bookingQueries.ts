/**
 * ============================================================================
 * FILE: features/bookings/server/bookingQueries.ts
 * ============================================================================
 * PURPOSE:
 *   Read-only database access for bookings. Wraps the Prisma findMany call
 *   used by GET /api/bookings, so app/api/bookings/route.ts never touches
 *   Prisma syntax directly.
 *
 * IMPORTS:
 *   - prisma (lib/prisma): shared Prisma client singleton
 *   - Booking (features/bookings/types): shared type for a single booking
 *
 * EXPORTS:
 *   - getBookings(roomId: string | null): Promise<Booking[]>
 *
 * AI ASSISTANCE:
 *   Extracted from the original monolithic app/api/bookings/route.ts by
 *   Claude (Anthropic, Sonnet) on 2026-08-07. Query logic (findMany,
 *   optional roomId filter, orderBy startTime) unchanged from the
 *   original GET handler — only relocated into a dedicated data-access
 *   function.
 * ============================================================================
 */

import { prisma } from '@/lib/prisma';
import type { Booking } from '@prisma/client';

// Why this is needed: isolating this one query in its own function means
// the route handler (and, later, any other feature that needs bookings —
// e.g. a future admin view) can call getBookings() without knowing or
// caring about Prisma's query syntax.
// What happens if this is removed: the findMany call would have to live
// directly inside app/api/bookings/route.ts, mixing HTTP concerns with
// data-access concerns and making the route handler harder to read and
// defend on its own.
export async function getBookings(roomId: string | null): Promise<Booking[]> {
  // Why this is needed: roomId ? { roomId } : undefined means "filter by
  // room if one was given, otherwise return bookings across ALL rooms."
  // Passing `undefined` as the `where` clause is Prisma's way of saying
  // "no filter" — passing `{ roomId: null }` would instead try to match
  // bookings with a literal null roomId, which is not the intent here.
  // What happens if this is removed: the endpoint would always require a
  // roomId (breaking any future "view all bookings" use case), or would
  // need a separate code path for the unfiltered case.
  return prisma.booking.findMany({
    where: roomId ? { roomId } : undefined,
    orderBy: { startTime: 'asc' },
  });
}