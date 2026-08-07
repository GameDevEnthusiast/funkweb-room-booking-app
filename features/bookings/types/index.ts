/**
 * ============================================================================
 * FILE: features/bookings/types/index.ts
 * ============================================================================
 * PURPOSE:
 *   Shared TypeScript types for the Bookings feature — but specifically the
 *   types that describe data AFTER it has crossed the client/server JSON
 *   boundary (i.e. what actually arrives in the browser via fetch), plus
 *   the validated input shape used internally on the server before a
 *   database write. Types used by only one component stay colocated in
 *   that component's own file instead of here.
 *
 * IMPORTS:
 *   None.
 *
 * EXPORTS:
 *   - Booking: a booking as received by the CLIENT over JSON (string dates)
 *   - NewBookingInput: validated input used SERVER-SIDE only (Date objects)
 *   - ApiResponse<T>: discriminated union for every API response shape
 *
 * AI ASSISTANCE:
 *   Authored by Claude (Anthropic, Sonnet) on 2026-08-07 while extracting
 *   shared shapes out of the original monolithic app/page.tsx (which had
 *   an inline `interface Booking`) and app/api/bookings/route.ts (which had
 *   no shared response type at all).
 * ============================================================================
 */

// Why this is needed: JSON has no "Date" type — when the API sends a
// booking to the browser via NextResponse.json(), Prisma's Date objects
// are automatically serialized to ISO strings. This type describes that
// exact wire shape, which is what useRoomBookings, useBookingForm, and
// every display component actually receive and work with.
// What happens if this is removed: components would have no compile-time
// guarantee that booking.startTime is a string vs. a Date object, risking
// a mismatch with formatDateTimeRange's (string, string) signature.
export interface Booking {
  id: string;
  roomId: string;
  title: string;
  userName: string;
  startTime: string; // ISO string, as received over JSON — NOT a Date object
  endTime: string;   // ISO string
}

// Why this is needed: this describes the shape AFTER bookingValidation.ts
// has parsed and checked the raw request body — startTime/endTime are
// real Date objects here because this type is only ever used SERVER-SIDE,
// passed directly into Prisma (which expects Date objects for DateTime
// fields), and never serialized to JSON itself.
// What happens if this is removed: bookingTransactions.ts would have no
// compile-time guarantee that it's receiving already-validated,
// already-parsed data, and could accidentally accept raw, unchecked input.
export interface NewBookingInput {
  roomId: string;
  title: string;
  userName: string;
  startTime: Date;
  endTime: Date;
}

// Why this is needed: a discriminated union (success: true WITH data, OR
// success: false WITH error — never both, never neither) lets TypeScript
// automatically narrow the type inside `if (json.success)` checks, so
// `json.data` is only accessible when it's guaranteed to exist, and
// `json.error` only when it's guaranteed to exist. This matches exactly
// how every route.ts handler and every hook already uses these responses.
// What happens if this is removed: a looser type (e.g. both fields
// optional) would compile fine but let you accidentally read `json.data`
// in the failure branch, which would be `undefined` at runtime with no
// compiler warning.
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };