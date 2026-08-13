import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Replaced 2026-08-12: real office room list (10 rooms, all Floor 5)
// swapped in for the original 3 placeholder rooms. `floor` is intentionally
// NOT included here — it's not a column on the current Room model. It's
// tracked in features/bookings/constants/rooms.ts as display-only metadata
// for now. If floor needs to be queryable/filterable later, add
// `floor Int` to the Room model in schema.prisma, run
// `npx prisma migrate dev --name add_room_floor`, then add `floor: 5` to
// each entry below.
//
// Updated again 2026-08-12: `name` now includes capacity (e.g.
// "Møterom 1 (Capacity: 12)") so it shows up in the RoomSelector dropdown
// without touching any component code. The numeric `capacity` field below
// is unchanged and still populates the separate `capacity` column on Room.
const DEFAULT_ROOMS = [
  { id: 'hans-kontor', name: 'Hans Kontor (Capacity: 3)', capacity: 3 },
  { id: 'moterom-1', name: 'Møterom 1 (Capacity: 12)', capacity: 12 },
  { id: 'moterom-2', name: 'Møterom 2 (Capacity: 4)', capacity: 4 },
  { id: 'moterom-3', name: 'Møterom 3 (Capacity: 4)', capacity: 4 },
  { id: 'moterom-4', name: 'Møterom 4 (Capacity: 3)', capacity: 3 },
  { id: 'moterom-5', name: 'Møterom 5 (Capacity: 3)', capacity: 3 },
  { id: 'moterom-6', name: 'Møterom 6 (Capacity: 3)', capacity: 3 },
  { id: 'moterom-7', name: 'Møterom 7 (Capacity: 4)', capacity: 4 },
  { id: 'moterom-8', name: 'Møterom 8 (Capacity: 10)', capacity: 10 },
  { id: 'moterom-laila', name: 'Møterom - Laila (Capacity: 3)', capacity: 3 },
];

async function main() {
  console.log('Enabling Write-Ahead Logging (WAL) mode...');
  await prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL;');
  // [ORIGINAL CODE]: await prisma.$executeRawUnsafe('PRAGMA journal_mode = WAL;');
  // [WHY IT WAS WRONG]: SQLite's `PRAGMA journal_mode = WAL` always returns a row containing 
  // the new journal mode. Prisma's `$executeRawUnsafe` is strictly typed for statements that 
  // only return an affected-row count (like INSERT/UPDATE), so it throws a P2010 "Execute returned results"
  //  error when it receives a result set back from SQLite.
  // [HOW THIS IS BETTER]: `$queryRawUnsafe` is explicitly designed to handle statements that return rows. 
  // It gracefully accepts the returned journal mode row (or an empty array if nothing is returned) without throwing 
  // a type or execution error, allowing the script to safely proceed.
  // [WHAT HAPPENS IF REMOVED]: The database will default to its standard rollback journal mode instead of WAL. 
  // This drastically reduces concurrent read/write performance and increases the likelihood of database lock timeouts 
  // (P2024) under load.
  // [BEST PRACTICE]: When executing raw SQL against an ORM, always verify whether the underlying database engine 
  // returns a payload for that specific command, and choose your ORM's raw execution method (query vs. execute) 
  // accordingly to maintain type safety.

  console.log('Seeding database with default rooms...');
  for (const room of DEFAULT_ROOMS) {
    await prisma.room.upsert({
      where: { id: room.id },
      update: { name: room.name, capacity: room.capacity },
      create: room,
    });
  }
  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });