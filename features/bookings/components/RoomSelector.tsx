/**
 * ============================================================================
 * FILE: features/bookings/components/RoomSelector.tsx
 * ============================================================================
 * PURPOSE:
 *   Renders the room <select> dropdown. Purely presentational — it does not
 *   own the "which room is selected" state itself; that state lives in
 *   app/page.tsx and is passed down, because both this component AND
 *   useRoomBookings AND BookingForm all need to agree on the same value.
 *
 * IMPORTS:
 *   - ROOMS (features/bookings/constants/rooms): static list of bookable rooms
 *
 * EXPORTS:
 *   - default: RoomSelector component
 *
 * AI ASSISTANCE:
 *   Extracted from the original monolithic app/page.tsx by Claude
 *   (Anthropic, Sonnet) on 2026-08-07. Logic unchanged from the original
 *   inline <select> — only moved into its own file and given explicit props.
 * ============================================================================
 */

import { ROOMS } from '@/features/bookings/constants/rooms';

// Why this is needed: this type is only ever used by this one component, so
// per our earlier agreement it stays colocated here rather than living in
// the shared features/bookings/types/index.ts file.
// What happens if this is removed: TypeScript would fall back to implicit
// `any` for the props, losing compile-time safety on the onChange signature.
interface RoomSelectorProps {
  selectedRoom: string;
  onChange: (roomId: string) => void;
}

export default function RoomSelector({ selectedRoom, onChange }: RoomSelectorProps) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <label style={{ fontWeight: 'bold', marginRight: '10px' }}>Select Room:</label>
      <select
        value={selectedRoom}
        // Why this is needed: onChange is called with just the roomId
        // string, not the raw DOM event — the parent (app/page.tsx) doesn't
        // need to know this is backed by an HTML <select> element at all.
        // What happens if this is removed: the dropdown would render but
        // never actually change which room is selected, since nothing
        // would notify the parent state.
        onChange={(e) => onChange(e.target.value)}
        style={{ padding: '8px 12px', fontSize: '16px' }}
      >
        {ROOMS.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>
    </div>
  );
}