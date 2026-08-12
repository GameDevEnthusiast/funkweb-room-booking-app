/**
 * ============================================================================
 * FILE: features/statistics/components/PeakHoursCard.tsx
 * PURPOSE: Presentational component displaying top peak usage hour slots per room.
 * IMPORTS: RoomPeakHours (from ../types), styles (from ./PeakHoursCard.module.css)
 * EXPORTS: PeakHoursCardList
 * ============================================================================
 */

import { RoomPeakHours } from "../types";
import styles from "./PeakHoursCard.module.css";

interface PeakHoursCardListProps {
  data: RoomPeakHours[];
}

export function PeakHoursCardList({ data }: PeakHoursCardListProps) {
  if (data.length === 0) {
    return <p>Ingen bookinger registrert ennå.</p>;
  }

  return (
    <ul className={styles.cardList}>
      {data.map((room) => (
        <li key={room.roomId} className={styles.card}>
          <h3>{room.roomName}</h3>
          {room.peakSlots.length > 0 ? (
            <ol className={styles.slotList}>
              {room.peakSlots.map((slot) => (
                <li key={slot.hour}>
                  <span className={styles.slotLabel}>{slot.label}</span>
                  <span className={styles.slotCount}>
                    {slot.count} {slot.count === 1 ? "booking" : "bookinger"}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p>Ingen data.</p>
          )}
        </li>
      ))}
    </ul>
  );
}