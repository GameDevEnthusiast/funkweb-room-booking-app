/**
 * ============================================================================
 * FILE: app/statistics/page.tsx
 * PURPOSE: Server page component for the statistics dashboard, fetching aggregated usage metrics and rendering modular feature UI components.
 * IMPORTS: getDashboardData (@/features/statistics/server/statisticsQueries), RoomPopularityTable (@/features/statistics/components/RoomPopularityTable), EmployeeStatsCardList (@/features/statistics/components/EmployeeStatsCard), PeakHoursCardList (@/features/statistics/components/PeakHoursCard), styles (./statistics.module.css)
 * EXPORTS: default StatisticsPage
 * ============================================================================
 */

import { getDashboardData } from "@/features/statistics/server/statisticsQueries";
import { RoomPopularityTable } from "@/features/statistics/components/RoomPopularityTable";
import { EmployeeStatsCardList } from "@/features/statistics/components/EmployeeStatsCard";
import { PeakHoursCardList } from "@/features/statistics/components/PeakHoursCard";
import styles from "./statistics.module.css";

export const dynamic = "force-dynamic";

export default async function StatisticsPage() {
  const { roomPopularity, employeeStats, roomPeakHours } =
    await getDashboardData();

  return (
    <main className={styles.container}>
      <h1>Statistikk-dashboard</h1>

      {/* 1. Room Popularity */}
      <section aria-labelledby="room-popularity-heading">
        <h2 id="room-popularity-heading">Møterommenes popularitet</h2>
        <RoomPopularityTable data={roomPopularity} />
      </section>

      {/* 2. Employee Statistics */}
      <section aria-labelledby="employee-stats-heading">
        <h2 id="employee-stats-heading">Ansattstatistikk</h2>
        <EmployeeStatsCardList data={employeeStats} />
      </section>

      {/* 3. Peak Hours per Room */}
      <section aria-labelledby="peak-hours-heading">
        <h2 id="peak-hours-heading">Travleste tidspunkt per rom</h2>
        <PeakHoursCardList data={roomPeakHours} />
      </section>
    </main>
  );
}