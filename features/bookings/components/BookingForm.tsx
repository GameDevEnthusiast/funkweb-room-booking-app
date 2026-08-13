/**
 * ============================================================================
 * FILE: features/bookings/components/BookingForm.tsx
 * ============================================================================
 * PURPOSE:
 *   Renders the "Reserve Time Slot" form. All field state, loading state,
 *   success/error messaging, and submit logic are delegated to the
 *   useBookingForm hook — this component's job is only to render inputs
 *   bound to that hook's state and call its handlers.
 *
 * IMPORTS:
 *   - useBookingForm (features/bookings/hooks/useBookingForm): owns form
 *     state + the POST /api/bookings submit logic
 *   - StatusBanner (features/bookings/components/StatusBanner): renders the
 *     success/error message returned by the hook
 *
 * EXPORTS:
 *   - default: BookingForm component
 *
 * AI ASSISTANCE:
 *   Extracted from the original monolithic app/page.tsx by Claude
 *   (Anthropic, Sonnet) on 2026-08-07. Field logic and submit behavior are
 *   unchanged from the original — only relocated and split between this
 *   presentational component and the useBookingForm hook.
 * ============================================================================
 */

import { useBookingForm } from '@/features/bookings/hooks/useBookingForm';
import StatusBanner from '@/features/bookings/components/StatusBanner';

// Why this is needed: only this component consumes these props, so per our
// types agreement this interface stays colocated here instead of in the
// shared features/bookings/types/index.ts file.
// What happens if this is removed: TypeScript loses type safety on what
// app/page.tsx is required to pass in (roomId, onBookingCreated).
interface BookingFormProps {
  roomId: string;
  onBookingCreated: () => void;
}

export default function BookingForm({ roomId, onBookingCreated }: BookingFormProps) {
  // Why this is needed: pulling ALL form state and the submit handler from
  // one hook call keeps this component free of useState/fetch logic
  // entirely — it's pure JSX wired to a single source of truth.
  // What happens if this is removed: this component would have to declare
  // five separate useState calls plus a handleSubmit function itself,
  // putting us back to the original monolithic page.tsx structure.
  const {
    title, setTitle,
    userName, setUserName,
    date, setDate,
    startTime, setStartTime,
    endTime, setEndTime,
    loading,
    message,
    handleSubmit,
  } = useBookingForm(roomId, onBookingCreated);

  return (
    <>
      {/*
        Why this is needed: message is null until a submit attempt happens,
        so StatusBanner only renders once there's something to say.
        What happens if this is removed: the user would get no feedback on
        whether their reservation succeeded or failed.
      */}
      {message && <StatusBanner text={message.text} type={message.type} />}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Meeting Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Your Name</label>
          <input
            type="text"
            required
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Start Time</label>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>End Time</label>
            <input
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
        </div>

        {/*
          Why this is needed: disabling the button while loading is true
          prevents a user from double-clicking "Reserve" and firing two
          near-simultaneous POST requests for the exact same slot — a
          second, client-side line of defense in front of the server-side
          transaction check in bookingTransactions.ts.
          What happens if this is removed: rapid double-clicks could send
          two overlapping requests; the server transaction would still
          correctly reject the second one, but the user would see a
          confusing error instead of a smooth single submission.
        */}
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 20px',
            background: '#fab63a',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Processing...' : 'Reserve Room'}
        </button>
      </form>
    </>
  );
}